import { Request, Response } from 'express';
import pool from '../helpers/pool'; // Asegúrate de ajustar la ruta a tu módulo de pool
import { open } from 'node-adodb';
import { AccessParser } from 'accessDB-parser';
import fs from 'fs';
import config from '../../../config.json';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const dbFilePath = config.file.path_file_factusol;
const JWT_SECRET: string = process.env.JWT_SECRET || '45C5FF775A69B523C2407189D62592BC';

/**
 * Sanitiza un valor reemplazando las comillas simples por dos.
 */
function sanitize(value: string): string {
  if (!value) return '';
  return value.replace(/'/g, "''");
}

/**
 * Crea un usuario en PostgreSQL (tabla usuarios) y luego lo inserta en Access (tabla F_CLI).
 * Se espera que se reciba WEBPASS (contraseña en hash) en el body.
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  console.log("Body recibido:", req.body);
  const { NAME, SURNAME, EMAIL, ADDRESS, DNI, TELF, CP, POB, PROV, PAIS, TDC, WEBPASS } = req.body;
  
  try {
    // Verificar que se hayan enviado los campos obligatorios
    if (!NAME || !SURNAME || !EMAIL || !ADDRESS || !TELF || !CP || !POB || !PROV || !PAIS || !WEBPASS) {
      res.status(400).json({ error: 'Todos los campos obligatorios son requeridos' });
      return;
    }
    
    // Comprobación de duplicados: verifica si el nombre de usuario o el correo ya existen
    const checkQuery = {
      text: 'SELECT LOWER(NAME) as name, LOWER(EMAIL) as email FROM usuarios WHERE LOWER(NAME) = LOWER($1) OR LOWER(EMAIL) = LOWER($2)',
      values: [NAME, EMAIL]
    };
    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      const inputName = NAME.toLowerCase();
      const inputEmail = EMAIL.toLowerCase();
      
      let usernameExists = false;
      let emailExists = false;
      
      checkResult.rows.forEach(row => {
        if (row.name === inputName) usernameExists = true;
        if (row.email === inputEmail) emailExists = true;
      });

      if (usernameExists && emailExists) {
        res.status(400).json({ error: 'El nombre de usuario y el correo ya están registrados' });
        return;
      } else if (usernameExists) {
        res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
        return;
      } else if (emailExists) {
        res.status(400).json({ error: 'El correo ya está registrado' });
        return;
      }
    }
    
    // Obtener el siguiente ID de cliente basándonos solo en PostgreSQL (para no esperar Access)
    const nextId = await getNextClientId();

    // Insertar el usuario en PostgreSQL (tabla usuarios)
    const query = {
      text: 'INSERT INTO usuarios (CODCLI, NAME, SURNAME, EMAIL, ADDRESS, DNI, TELF, CP, POB, PROV, PAIS, TDC, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
      values: [nextId, NAME, SURNAME, EMAIL, ADDRESS, DNI, TELF, CP, POB, PROV, PAIS, TDC, WEBPASS]
    };
    await pool.query(query);

    // Enviar la respuesta de inmediato al front
    res.status(201).json({ message: 'Usuario registrado correctamente' });
    
    // Inserta el usuario en Access de manera asíncrona
    insertUserIntoAccessDB(nextId, NAME, SURNAME, EMAIL, ADDRESS, DNI, TELF, CP, POB, PROV, PAIS, TDC, WEBPASS)
      .catch((err) => console.error('Error insertando usuario en Access:', err));

    // Lanza de forma asíncrona la verificación para ajustar conflictos de CODCLI en Access
    adjustCodcliIfConflict(nextId).catch(err => console.error("Error ajustando conflicto de CODCLI:", err));
    
  } catch (error) {
    console.error('Error al añadir usuario:', error);
    res.status(500).json({ error: 'Error al añadir usuario' });
  }
}

/**
 * Obtiene el siguiente ID de cliente basándose únicamente en PostgreSQL.
 */
export async function getNextClientId(): Promise<number> {
  try {
    const result = await pool.query('SELECT MAX(CODCLI) as maxId FROM usuarios');
    // node-postgres convierte alias a minúsculas
    const maxPostgres = result.rows[0].maxid !== null ? Number(result.rows[0].maxid) : 0;
    return maxPostgres + 1;
  } catch (error) {
    console.error('Error fetching next client ID from PostgreSQL:', error);
    throw error;
  }
}

/**
 * Inserta un usuario en la tabla F_CLI del archivo Access.
 */
async function insertUserIntoAccessDB(
  CODCLI: number,
  NAME: string,
  SURNAME: string,
  EMAIL: string,
  ADDRESS: string,
  DNI: string,
  TELF: string,
  CP: string,
  POB: string,
  PROV: string,
  PAIS: string,
  TDC: string,
  WEBPASS: string
): Promise<void> {
  const connection = open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbFilePath};`);
  try {
    const sName    = sanitize(NAME);
    const sSurname = sanitize(SURNAME);
    const sEmail   = sanitize(EMAIL);
    const sAddress = sanitize(ADDRESS);
    const sDNI     = sanitize(DNI);
    const sTELF    = sanitize(TELF);
    const sCP      = sanitize(CP);
    const sPOB     = sanitize(POB);
    const sPROV    = sanitize(PROV);
    const sWEBPASS = sanitize(WEBPASS);
    
    const sql = `
      INSERT INTO F_CLI (CUWCLI, CAWCLI, CODCLI, NIFCLI, NOFCLI, NOCCLI, DOMCLI, POBCLI, CPOCLI, PROCLI, TELCLI, EMACLI)
      VALUES ('${CODCLI}', '${sWEBPASS}', ${CODCLI}, '${sDNI}', '${sName} ${sSurname}', '', '${sAddress}', '${sPOB}', '${sCP}', '${sPROV}', '${sTELF}', '${sEmail}')
    `;
    await connection.execute(sql);
  } catch (error) {
    console.error('Error inserting user into Access database:', error);
    throw error;
  }
}

/**
 * Función asíncrona para verificar conflictos de CODCLI en Access y, si es necesario,
 * actualizar el valor del CODCLI en PostgreSQL (tabla usuarios) y en Access.
 */
async function adjustCodcliIfConflict(currentCodcli: number): Promise<void> {
  try {
    // Lee la tabla F_CLI de Access para obtener el máximo CODCLI
    const dbFile = fs.readFileSync(dbFilePath);
    const db = new AccessParser(dbFile);
    const data = db.parseTable("F_CLI");
    let maxAccess = 0;
    if (data && data.length > 0) {
      maxAccess = data.reduce((max: number, item: any) => {
        const id = Number(item.data.CODCLI);
        return id > max ? id : max;
      }, 0);
    }
    // Si el currentCodcli es menor o igual que el máximo en Access, hay conflicto
    if (currentCodcli <= maxAccess) {
      const newCodcli = maxAccess + 1;
      console.log(`Conflict detected: current CODCLI = ${currentCodcli}, new CODCLI should be ${newCodcli}`);
      
      // Actualiza en la tabla usuarios de PostgreSQL
      await pool.query({
        text: 'UPDATE usuarios SET CODCLI = $1 WHERE CODCLI = $2',
        values: [newCodcli, currentCodcli]
      });
      
      // Actualiza en Access
      const connection = open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbFilePath};`);
      await connection.execute(`UPDATE F_CLI SET CODCLI = ${newCodcli} WHERE CODCLI = ${currentCodcli}`);
      
      console.log(`CODCLI updated to ${newCodcli} in both PostgreSQL and Access.`);
    } else {
      console.log(`No CODCLI conflict detected: current CODCLI = ${currentCodcli}, maxAccess = ${maxAccess}`);
    }
  } catch (error) {
    console.error("Error adjusting CODCLI conflict:", error);
  }
}

/**
 * Endpoint para actualizar el perfil del usuario.
 * Se espera recibir en el body los siguientes campos:
 * CODCLI, NAME, SURNAME, EMAIL, ADDRESS, DNI, TELF, CP, POB, PROV, PAIS, TDC.
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  const { CODCLI, NAME, SURNAME, EMAIL, ADDRESS, DNI, TELF, CP, POB, PROV, PAIS, TDC } = req.body;
  
  // Validación mínima: se requiere el identificador del usuario.
  if (!CODCLI) {
    res.status(400).json({ error: 'El identificador del usuario (CODCLI) es requerido' });
    return;
  }
  
  try {
    // Actualiza en PostgreSQL
    const updateQuery = {
      text: `UPDATE usuarios
             SET NAME = $1, SURNAME = $2, EMAIL = $3, ADDRESS = $4, DNI = $5, TELF = $6, CP = $7, POB = $8, PROV = $9, PAIS = $10, TDC = $11
             WHERE CODCLI = $12
             RETURNING *`,
      values: [NAME, SURNAME, EMAIL, ADDRESS, DNI, TELF, CP, POB, PROV, PAIS, TDC, CODCLI]
    };
    const result = await pool.query(updateQuery);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    const updatedUser = result.rows[0];
    
    // Actualizar la información en Access para mantener la sincronización.
    const sName    = sanitize(NAME);
    const sSurname = sanitize(SURNAME);
    const sEmail   = sanitize(EMAIL);
    const sAddress = sanitize(ADDRESS);
    const sDNI     = sanitize(DNI);
    const sTELF    = sanitize(TELF);
    const sCP      = sanitize(CP);
    const sPOB     = sanitize(POB);
    const sPROV    = sanitize(PROV);
    const sTDC     = sanitize(TDC);
    
    const updateAccessSql = `
      UPDATE F_CLI
      SET NOFCLI = '${sName} ${sSurname}',
          EMACLI = '${sEmail}',
          DOMCLI = '${sAddress}',
          NIFCLI = '${sDNI}',
          TELCLI = '${sTELF}',
          CPOCLI = '${sCP}',
          POBCLI = '${sPOB}',
          PROCLI = '${sPROV}',
          CAWCLI = '${sTDC}'
      WHERE CODCLI = ${CODCLI}
    `;
    
    const connection = open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbFilePath};`);
    await connection.execute(updateAccessSql);
    
    res.status(200).json({ message: 'Perfil actualizado correctamente', updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error interno al actualizar el perfil' });
  }
}

/**
 * Endpoint de login: recibe username y password, busca el usuario en PostgreSQL, 
 * compara la contraseña ingresada con el hash almacenado y retorna el usuario si es válido.
 */
export async function loginUser(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;
  
  if (!username || !password) {
    console.log("Missing username or password:", username, password);
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  
  console.log("Username received:", username);
  console.log("Password received:", password);
  
  try {
    // Buscar el usuario por EMAIL o por NAME (en minúsculas)
    const query = {
      text: 'SELECT * FROM usuarios WHERE LOWER(EMAIL) = LOWER($1) OR LOWER(NAME) = LOWER($1)',
      values: [username]
    };
    console.log("Executing query:", query);
    const result = await pool.query(query);
    console.log("Query result rows:", result.rows);
    
    if (result.rows.length === 0) {
      console.log("No user found with email or name:", username);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    const user = result.rows[0];
    console.log("User found:", user);
    
    const isValid = await bcrypt.compare(password, user.password);
    console.log("Password validation result:", isValid);
    
    if (!isValid) {
      console.log("Invalid password for user:", username);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    const token = jwt.sign(
      { id: user.CODCLI, email: user.EMAIL },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    delete user.password;
    console.log("Login successful for user:", user);
    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
