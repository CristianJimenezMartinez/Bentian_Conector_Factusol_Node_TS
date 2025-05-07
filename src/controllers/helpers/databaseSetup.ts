// src/helpers/databaseSetup.ts

import { Pool } from 'pg';
import config from '../../../config.json';
import dotenv from 'dotenv';

dotenv.config();

// Pool temporal para conectarse a la base de datos "postgres"
const poolPostgres = new Pool({
  host: config.database.host,
  user: config.database.user, // usuario con permisos sobre "postgres"
  password: config.database.password,
  port: config.database.port || undefined,
  database: 'postgres',
  max: 5,
  idleTimeoutMillis: 30000,
});

// Función que verifica si existe la base de datos "Factusol" y la crea si no existe
export async function crearBaseDeDatos(): Promise<void> {
  try {
    console.log('Conectando a PostgreSQL (base de datos "postgres") para verificar la base de datos.');
    let res;
    try {
      res = await poolPostgres.query("SELECT 1 FROM pg_database WHERE datname = 'Factusol'");
    } catch (error: any) {
      if (error.code === '3D000') { // La base de datos no existe
        console.warn("La base de datos Factusol no existe (error 3D000), procediendo a crearla.");
        res = { rowCount: 0 }; // Simula que no se encontró la base de datos
      } else {
        throw error;
      }
    }
    if (res.rowCount === 0) {
      await poolPostgres.query('CREATE DATABASE "Factusol"');
      console.log('Base de datos "Factusol" creada exitosamente');
    } else {
      console.log('La base de datos "Factusol" ya existe');
    }
  
    const resUser = await poolPostgres.query("SELECT 1 FROM pg_roles WHERE rolname = 'user_factusol'");
    if (resUser.rowCount === 0) {
      await poolPostgres.query("CREATE USER user_factusol WITH PASSWORD '123456789'");
      console.log('Usuario "user_factusol" creado exitosamente');
    } else {
      console.log('El usuario "user_factusol" ya existe');
    }
  
    await poolPostgres.query('GRANT ALL PRIVILEGES ON DATABASE "Factusol" TO user_factusol');
    console.log('Privilegios otorgados al usuario "user_factusol" en la base de datos "Factusol"');
  } catch (error) {
    console.error('Error al crear la base de datos o usuario:', error);
  } finally {
    await poolPostgres.end();
  }
}
