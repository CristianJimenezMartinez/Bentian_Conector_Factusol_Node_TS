"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const config_json_1 = __importDefault(require("../../../config.json"));
dotenv_1.default.config();
function connectToDatabase() {
    return new pg_1.Client({
        host: config_json_1.default.database.host,
        user: config_json_1.default.database.user_factusol,
        password: config_json_1.default.database.password,
        database: config_json_1.default.database.database,
        port: config_json_1.default.database.port ? config_json_1.default.database.port : undefined
    });
}
