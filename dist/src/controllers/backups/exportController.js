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
exports.generateAndUploadExport = generateAndUploadExport;
const fs_1 = __importDefault(require("fs"));
const basic_ftp_1 = __importDefault(require("basic-ftp"));
const pool_1 = __importDefault(require("../helpers/pool"));
const config_json_1 = __importDefault(require("../../../config.json"));
const helpers_1 = require("../helpers/helpers");
/**
 * Genera las sentencias SQL para exportar datos desde las tablas relevantes.
 * En este ejemplo se exportan f_cli y f_art; extiéndelo según sea necesario.
 */
function generateSQLExport() {
    return __awaiter(this, void 0, void 0, function* () {
        let sqlStatements = "";
        try {
            // Exportar datos de clientes (f_cli)
            const resCli = yield pool_1.default.query('SELECT * FROM f_cli');
            for (const row of resCli.rows) {
                sqlStatements += `INSERT INTO f_cli (CUWCLI, CAWCLI, CODCLI, NIFCLI, NOFCLI, NOCCLI, DOMCLI, POBCLI, CPOCLI, PROCLI, TELCLI, EMACLI)
VALUES ('${(0, helpers_1.sanitize)(row.cuwcli)}', '${(0, helpers_1.sanitize)(row.cawcli)}', ${row.codcli}, '${(0, helpers_1.sanitize)(row.nifcli)}', '${(0, helpers_1.sanitize)(row.nofcli)}', '${(0, helpers_1.sanitize)(row.noccli)}', '${(0, helpers_1.sanitize)(row.domcli)}', '${(0, helpers_1.sanitize)(row.pobcli)}', '${(0, helpers_1.sanitize)(row.cpocli)}', '${(0, helpers_1.sanitize)(row.procli)}', '${(0, helpers_1.sanitize)(row.telcli)}', '${(0, helpers_1.sanitize)(row.emacli)}');\n`;
            }
            // Exportar datos de artículos (f_art)
            const resArt = yield pool_1.default.query('SELECT * FROM f_art');
            for (const row of resArt.rows) {
                sqlStatements += `INSERT INTO f_art (CODART, EANART, FAMART, DESART, DEWART, TIVART, CP1ART, CP2ART, CP3ART, IMGART, MEWART, CSTART, USTART, SUWART)
VALUES ('${(0, helpers_1.sanitize)(row.codart)}', '${(0, helpers_1.sanitize)(row.eanart)}', '${(0, helpers_1.sanitize)(row.famart)}', '${(0, helpers_1.sanitize)(row.desart)}', '${(0, helpers_1.sanitize)(row.dewart)}', '${(0, helpers_1.sanitize)(row.tivart)}', '${(0, helpers_1.sanitize)(row.cp1art)}', '${(0, helpers_1.sanitize)(row.cp2art)}', '${(0, helpers_1.sanitize)(row.cp3art)}', '${(0, helpers_1.sanitize)(row.imgart)}', '${(0, helpers_1.sanitize)(row.mewart)}', '${(0, helpers_1.sanitize)(row.cstart)}', '${(0, helpers_1.sanitize)(row.ustart)}', ${row.suwart});\n`;
            }
        }
        catch (error) {
            console.error('Error generando SQL export:', error);
            throw error;
        }
        return sqlStatements;
    });
}
/**
 * Genera el archivo SQL de exportación.
 */
function exportSQLFile() {
    return __awaiter(this, void 0, void 0, function* () {
        const sqlContent = yield generateSQLExport();
        const fileName = 'factusolweb.sql';
        fs_1.default.writeFileSync(fileName, sqlContent, 'utf8');
        console.log('Fichero SQL generado.');
        return fileName;
    });
}
/**
 * Sube el fichero SQL generado al servidor FTP usando basic-ftp.
 */
function uploadSQLFile(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new basic_ftp_1.default.Client();
        client.ftp.verbose = true;
        try {
            yield client.access({
                host: config_json_1.default.ftp.host,
                user: config_json_1.default.ftp.user,
                password: config_json_1.default.ftp.password,
                secure: false
            });
            // Configura la ruta remota (si no está definida, se sube a la raíz)
            const remotePath = config_json_1.default.ftp.remotePath || '/';
            yield client.uploadFrom(fileName, remotePath + '/' + fileName);
            console.log('Fichero exportado subido correctamente.');
        }
        catch (error) {
            console.error('Error subiendo el fichero SQL:', error);
            throw error;
        }
        finally {
            client.close();
        }
    });
}
/**
 * Función principal que genera el fichero SQL y lo sube vía FTP.
 */
function generateAndUploadExport() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fileName = yield exportSQLFile();
            yield uploadSQLFile(fileName);
        }
        catch (error) {
            console.error('Error en la generación y subida del fichero SQL:', error);
        }
    });
}
