"use strict";
// src/helpers/databaseSetup.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearBaseDeDatos = crearBaseDeDatos;
const pg_1 = require("pg");
const config_json_1 = __importDefault(require("../../../config.json"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Pool temporal para conectarse a la base de datos "postgres"
const poolPostgres = new pg_1.Pool({
    host: config_json_1.default.database.host,
    user: config_json_1.default.database.user, // usuario con permisos sobre "postgres"
    password: config_json_1.default.database.password,
    port: config_json_1.default.database.port || undefined,
    database: 'postgres',
    max: 5,
    idleTimeoutMillis: 30000,
});
// Función que verifica si existe la base de datos "Factusol" y la crea si no existe
function crearBaseDeDatos() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Conectando a PostgreSQL (base de datos "postgres") para verificar la base de datos.');
            let res;
            try {
                res = yield poolPostgres.query("SELECT 1 FROM pg_database WHERE datname = 'Factusol'");
            }
            catch (error) {
                if (error.code === '3D000') { // La base de datos no existe
                    console.warn("La base de datos Factusol no existe (error 3D000), procediendo a crearla.");
                    res = { rowCount: 0 }; // Simula que no se encontró la base de datos
                }
                else {
                    throw error;
                }
            }
            if (res.rowCount === 0) {
                yield poolPostgres.query('CREATE DATABASE "Factusol"');
                console.log('Base de datos "Factusol" creada exitosamente');
            }
            else {
                console.log('La base de datos "Factusol" ya existe');
            }
            const resUser = yield poolPostgres.query("SELECT 1 FROM pg_roles WHERE rolname = 'user_factusol'");
            if (resUser.rowCount === 0) {
                yield poolPostgres.query("CREATE USER user_factusol WITH PASSWORD '123456789'");
                console.log('Usuario "user_factusol" creado exitosamente');
            }
            else {
                console.log('El usuario "user_factusol" ya existe');
            }
            yield poolPostgres.query('GRANT ALL PRIVILEGES ON DATABASE "Factusol" TO user_factusol');
            console.log('Privilegios otorgados al usuario "user_factusol" en la base de datos "Factusol"');
        }
        catch (error) {
            console.error('Error al crear la base de datos o usuario:', error);
        }
        finally {
            yield poolPostgres.end();
        }
    });
}
