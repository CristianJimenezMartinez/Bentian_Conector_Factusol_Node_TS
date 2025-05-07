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
exports.syncFotosFTP = syncFotosFTP;
const basic_ftp_1 = require("basic-ftp");
const config_json_1 = __importDefault(require("../../../config.json"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pool_1 = __importDefault(require("../helpers/pool")); // Si es necesario para otra lógica
// Define la carpeta local donde se encuentran las fotos a subir, obteniéndola de config.json
const localFolder = config_json_1.default.ftpImgPath;
function getFotosFromPostgres() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const query = `SELECT imgart FROM f_art WHERE imgart IS NOT NULL AND TRIM(imgart) <> ''`;
            const result = yield pool_1.default.query(query);
            // Se asume que cada fila tiene la propiedad imgart (como string)
            return result.rows.map((row) => row.imgart);
        }
        catch (error) {
            console.error("Error consultando fotos en PostgreSQL:", error);
            return [];
        }
    });
}
function uploadMissingPhotos() {
    return __awaiter(this, void 0, void 0, function* () {
        const ftpConfig = config_json_1.default.ftp;
        const client = new basic_ftp_1.Client();
        client.ftp.verbose = true; // Opcional: para ver logs detallados
        try {
            yield client.access({
                host: ftpConfig.host,
                user: ftpConfig.user,
                password: ftpConfig.password,
                secure: false // Ajusta según las necesidades de tu servidor FTP
            });
            console.log("Conectado al servidor FTP.");
            // Asegurarse de que el directorio remoto exista
            yield client.ensureDir(ftpConfig.remotePath);
            const remoteFiles = yield client.list();
            const remoteFileNames = new Set(remoteFiles.map(file => file.name));
            // Obtiene la lista de fotos desde PostgreSQL
            const fotos = yield getFotosFromPostgres();
            for (const fotoPath of fotos) {
                // Se asume que en el campo imgart se almacena la ruta completa al archivo
                const fileName = path_1.default.basename(fotoPath);
                if (remoteFileNames.has(fileName)) {
                    console.log(`La foto ${fileName} ya existe en el FTP, se omite.`);
                    continue;
                }
                if (!fs_1.default.existsSync(fotoPath)) {
                    console.warn(`El archivo local ${fotoPath} no existe, se omite.`);
                    continue;
                }
                console.log(`Subiendo ${fotoPath} a ${ftpConfig.remotePath}/${fileName}...`);
                try {
                    yield client.uploadFrom(fotoPath, fileName);
                    console.log(`Foto ${fileName} subida correctamente.`);
                }
                catch (uploadError) {
                    console.error(`Error subiendo ${fileName}:`, uploadError);
                }
            }
        }
        catch (error) {
            console.error("Error en la conexión o subida al FTP:", error);
        }
        finally {
            client.close();
        }
    });
}
function syncFotosFTP() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Iniciando sincronización de fotos al FTP...");
        yield uploadMissingPhotos();
        console.log("Sincronización inicial completada.");
    });
}
// Ejecuta la sincronización inicial
syncFotosFTP().catch(error => console.error("Error en la sincronización inicial de fotos:", error));
// Programa un intervalo para ejecutar la sincronización cada minuto (60000 ms)
setInterval(() => {
    console.log("Ejecutando sincronización automática de fotos al FTP...");
    uploadMissingPhotos().catch(error => console.error("Error en la sincronización automática:", error));
}, 60000);
