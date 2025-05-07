"use strict";
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
exports.readTableData = readTableData;
const node_adodb_1 = require("node-adodb");
const config_json_1 = __importDefault(require("../../../config.json"));
const dbFilePath = config_json_1.default.file.path_file_factusol;
/**
 * Lee los datos de la tabla especificada.
 * Si la tabla no existe (según el mensaje de error), retorna un array vacío.
 */
function readTableData(tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = (0, node_adodb_1.open)(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbFilePath};Persist Security Info=False;`);
        try {
            const query = `SELECT * FROM ${tableName}`;
            const result = yield connection.query(query);
            return result;
        }
        catch (error) {
            const errMsg = error.message || '';
            // Verificamos si el mensaje indica que no se encontró la tabla
            if (errMsg.toLowerCase().includes('no puede encontrar') && errMsg.toLowerCase().includes(tableName.toLowerCase())) {
                console.warn(`La tabla ${tableName} no existe. Se omite esta operación.`);
                return [];
            }
            // Si es otro error, lo relanzamos
            throw error;
        }
    });
}
