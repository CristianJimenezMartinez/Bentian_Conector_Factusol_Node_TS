import { open } from 'node-adodb';
import config from '../../../config.json';
import dotenv from 'dotenv';
// Asegúrate de que el archivo se llame "tableOrders.ts" (o la ruta sea correcta)
// y de exportar "tableOrders" tal cual. Por ejemplo:
// export const tableOrders: Record<string, string[]> = { ... };
import { tableOrders } from '../constants/tableOrders'; 
import pool from '../helpers/pool';

dotenv.config();

const dbFilePath = config.file.path_file_factusol;

// Arreglo de tablas a sincronizar según Factusol.
// Verifica que este arreglo respete la dependencia de claves foráneas (padres antes que hijos).
const tablas: string[] = [
  "F_CFG", "F_CLI", "F_AGE", "F_SEC", "F_FAM", "F_ART",  
  "F_TAR", "F_LTA", "F_DES", "F_FAC", "F_LFA", "F_FPA", "F_ALM", 
  "F_PCL", "F_LPC", "F_STO", "F_EMP", "F_UME"
];

// Mapeo de claves primarias para cada tabla (usando nombres en minúsculas)
const primaryKeyMapping: Record<string, string[]> = {
  f_cfg: ['codcfg'],
  f_sec: ['codsec'],
  f_fam: ['codfam'],
  f_cli: ['codcli'],
  f_art: ['codart'],
  f_age: ['codage'],
  f_tar: ['codtar'],
  f_lta: ['tarlta', 'artlta'],
  f_des: ['tipdes', 'artdes'],
  f_fac: ['codfac'],
  f_lfa: ['codlfa', 'poslfa'],
  f_fpa: ['codfpa'],
  f_alm: ['codalm'],
  f_pcl: ['codpcl'],
  f_lpc: ['codlpc', 'poslpc'],
  f_sto: ['artsto', 'almsto'],
  f_emp: ['codemp'],
  f_ume: ['codume']
};

/**
 * Función extractOleText: Extrae el texto útil del buffer OLE.
 * Se asume que el header OLE tiene 78 bytes (puede variar según el caso).
 */
function extractOleText(buffer: Buffer): string {
  const headerSize = 78;
  if (buffer.length <= headerSize) {
    return buffer.toString('latin1');
  }
  const textBuffer = buffer.slice(headerSize);
  const nullIndex = textBuffer.indexOf(0);
  if (nullIndex !== -1) {
    return textBuffer.slice(0, nullIndex).toString('latin1').trim();
  }
  return textBuffer.toString('latin1').trim();
}

/**
 * Función safeValue: procesa el valor leído desde Access.
 * Si el valor es un Buffer se intenta extraer el texto ignorando el header OLE.
 */
function safeValue(value: any): any {
  if (value === undefined || value === null) {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    try {
      return extractOleText(value);
    } catch (error) {
      return value.toString('latin1');
    }
  }
  return value;
}

/**
 * Función para leer datos desde Access.
 * Para F_FAM y F_SEC se usa una consulta especial; para el resto se utiliza SELECT *.
 */
async function readFileAccess(
  tabla: string,
  processChunk: (chunk: any[]) => Promise<void>,
  chunkSize = 2000
): Promise<void> {
  const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbFilePath};Persist Security Info=False;`;
  const connection = open(connectionString);
  let query = '';

  if (tabla.toUpperCase() === "F_FAM") {
    query = `
      SELECT CODFAM, DESFAM, SECFAM, TEXFAM, CUEFAM, CUCFAM, SUWFAM, IMFFAM, MPTFAM, PFIFAM, ORDFAM, RTIFAM, DEPFAM, SDEFAM 
      FROM F_FAM
    `;
  } else if (tabla.toUpperCase() === "F_SEC") {
    query = `
      SELECT CODSEC, DESSEC, SUWSEC, MPTSEC, ORDSEC
      FROM F_SEC
    `;
  } else {
    query = `SELECT * FROM ${tabla}`;
  }
  
  try {
    const result: any[] = await connection.query(query);
    const chunkPromises: Promise<void>[] = [];
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);
      chunkPromises.push(processChunk(chunk));
    }
    await Promise.all(chunkPromises);

    // Liberar memoria si Node.js está corriendo con --expose-gc
    if (global.gc) {
      global.gc();
    }
  } catch (error) {
    console.error(`Error al leer la tabla ${tabla}:`, error);
  }
}

/**
 * Función auxiliar que devuelve los valores de la fila ordenados según el arreglo dado.
 * Se asume que las claves en la fila están en mayúsculas.
 */
function getOrderedValues(row: any, order: string[]): any[] {
  return order.map((col: string) => safeValue(row[col.toUpperCase()]));
}

/**
 * Función genérica para actualizar o insertar datos en la base de datos utilizando el pool.
 * Se procesa fila a fila. Los valores se obtienen siempre en el mismo orden definido en tableOrders,
 * garantizando así que las sentencias INSERT/UPDATE tengan el orden correcto.
 */
async function upsertDataGeneric(tableName: string, data: any[]): Promise<void> {
  const tableKey = tableName.toLowerCase();
  const columns = tableOrders[tableKey];
  if (!columns) {
    console.warn(`No se definió orden de columnas para la tabla ${tableName}`);
    return;
  }
  const pkColumns = primaryKeyMapping[tableKey] || [];
  if (data.length === 0) return;

  let insertedCount = 0;
  let updatedCount = 0;

  for (const row of data) {
    let exists = false;
    let pkValues: any[] = [];
    let whereConditions = '';

    if (pkColumns.length > 0) {
      whereConditions = pkColumns.map((col: string, i: number) => `${col} = $${i + 1}`).join(' AND ');
      pkValues = getOrderedValues(row, pkColumns);

      try {
        const queryResult = await pool.query(`SELECT * FROM ${tableKey} WHERE ${whereConditions}`, pkValues);
        if (queryResult.rows && queryResult.rows.length > 0) {
          exists = true;
        }
      } catch (err) {
        console.error(`Error al verificar existencia en ${tableName}:`, err);
      }
    }

    if (exists) {
      const columnsToUpdate = columns.filter((col: string) => !pkColumns.includes(col));
      const setClause = columnsToUpdate
        .map((col: string, index: number) => `${col} = $${index + 1}`)
        .join(', ');

      const whereClause = pkColumns
        .map((col: string, index: number) => `${col} = $${columnsToUpdate.length + index + 1}`)
        .join(' AND ');

      const updateValues = getOrderedValues(row, columnsToUpdate);
      const allValues = updateValues.concat(pkValues);

      const updateQuery = `UPDATE ${tableKey} SET ${setClause} WHERE ${whereClause}`;
      try {
        await pool.query(updateQuery, allValues);
        updatedCount++;
      } catch (err) {
        console.error(`Error actualizando fila en ${tableName}:`, err);
      }
    } else {
      const values = getOrderedValues(row, columns);
      const columnsSQL = columns.join(', ');
      const placeholders = columns.map((_: string, idx: number) => `$${idx + 1}`).join(', ');
      const insertQuery = `INSERT INTO ${tableKey} (${columnsSQL}) VALUES (${placeholders})`;

      try {
        await pool.query(insertQuery, values);
        insertedCount++;
      } catch (err) {
        console.error(`Error insertando fila en ${tableName}:`, err);
      }
    }
  }

  console.log(`Sincronización final para ${tableName}: ${insertedCount} insertados, ${updatedCount} actualizados.`);
}

/**
 * Función principal que recorre cada tabla, lee los datos de Access y los inserta o actualiza en PostgreSQL.
 * Se pueden procesar las tablas de forma secuencial en el orden del array "tablas"
 * para respetar las claves foráneas (padres antes que hijos).
 */
export async function getData(): Promise<void> {
  try {
    // Si necesitas procesar las tablas secuencialmente para evitar problemas de FK, 
    // reemplaza Promise.all por un bucle for...of. Ejemplo:
    for (const tabla of tablas) {
      await readFileAccess(tabla, async (chunk: any[]) => {
        await upsertDataGeneric(tabla, chunk);
      });
      console.log(`Sincronización completada para ${tabla}.`);
    }

    // O si no tienes dependencias de FK crítico, podrías hacer:
    // await Promise.all(tablas.map(async (tabla) => {
    //   await readFileAccess(tabla, async (chunk: any[]) => {
    //     await upsertDataGeneric(tabla, chunk);
    //   });
    //   console.log(`Sincronización completada para ${tabla}.`);
    // }));
  } catch (error) {
    console.error("Error en la sincronización:", error);
  }
}
