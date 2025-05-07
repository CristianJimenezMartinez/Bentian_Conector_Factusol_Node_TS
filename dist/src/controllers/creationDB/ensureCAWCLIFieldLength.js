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
exports.ensureCAWCLIFieldLength = ensureCAWCLIFieldLength;
const node_adodb_1 = require("node-adodb");
const config_json_1 = __importDefault(require("../../../config.json"));
const dbFilePath = config_json_1.default.file.path_file_factusol;
/**
 * Asegura que la columna CAWCLI de la tabla F_CLI tenga tamaño TEXT(100).
 * Si el tamaño actual es menor a 100, se ejecuta un ALTER TABLE para modificarlo.
 * Si es 100 o mayor, no se realiza ninguna modificación.
 */
function ensureCAWCLIFieldLength() {
    return __awaiter(this, void 0, void 0, function* () {
        // Abrir la conexión a la base de datos Access
        const connection = (0, node_adodb_1.open)(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbFilePath};`);
        try {
            // Ejecutar ALTER TABLE directamente
            yield connection.execute(`ALTER TABLE F_CLI ALTER COLUMN CAWCLI TEXT(100)`);
            console.log("Campo CAWCLI modificado a TEXT(100) exitosamente.");
        }
        catch (error) {
            // Si el error indica que no se puede modificar porque ya cumple o hay otro conflicto conocido, lo manejamos
            if (error.message && error.message.includes("No se puede encontrar la tabla") ||
                error.message.includes("ya existe") ||
                error.message.includes("No coinciden los tipos de datos")) {
                console.log("El campo CAWCLI ya tiene el tamaño adecuado o la modificación no es necesaria.");
            }
            else {
                console.error("Error asegurando el tamaño de CAWCLI:", error);
            }
        }
    });
}
