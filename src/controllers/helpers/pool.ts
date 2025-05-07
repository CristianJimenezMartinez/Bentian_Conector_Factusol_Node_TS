import { Pool } from 'pg';
import dotenv from 'dotenv';
import config from '../../../config.json';

dotenv.config();

const pool = new Pool({
    host: config.database.host,
    user: config.database.user_factusol,         // Se usa user_factusol
    password: config.database.password_factusol,   // Se usa password_factusol
    database: config.database.database,
    port: config.database.port ? config.database.port : undefined,
    max: 10,            // Número máximo de conexiones en el pool
    idleTimeoutMillis: 30000, // Tiempo de espera para cerrar conexiones inactivas
});

export default pool;
