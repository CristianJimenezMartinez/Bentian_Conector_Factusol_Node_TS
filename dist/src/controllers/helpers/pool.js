"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const config_json_1 = __importDefault(require("../../../config.json"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    host: config_json_1.default.database.host,
    user: config_json_1.default.database.user_factusol, // Se usa user_factusol
    password: config_json_1.default.database.password_factusol, // Se usa password_factusol
    database: config_json_1.default.database.database,
    port: config_json_1.default.database.port ? config_json_1.default.database.port : undefined,
    max: 10, // Número máximo de conexiones en el pool
    idleTimeoutMillis: 30000, // Tiempo de espera para cerrar conexiones inactivas
});
exports.default = pool;
