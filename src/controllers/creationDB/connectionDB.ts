import { Client } from 'pg';
import dotenv from 'dotenv';
import config from '../../../config.json';

dotenv.config();

export function connectToDatabase() {
    return new Client({
        host: config.database.host,
        user: config.database.user_factusol,
        password: config.database.password,
        database: config.database.database,
        port: config.database.port ? config.database.port : undefined
    });
}