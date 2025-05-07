import { Client } from "basic-ftp";
import config from "../../../config.json";
import fs from "fs";
import path from "path";
import pool from "../helpers/pool"; // Si es necesario para otra lógica

// Define la carpeta local donde se encuentran las fotos a subir, obteniéndola de config.json
const localFolder = config.ftpImgPath;

async function getFotosFromPostgres(): Promise<string[]> {
    try {
        const query = `SELECT imgart FROM f_art WHERE imgart IS NOT NULL AND TRIM(imgart) <> ''`;
        const result = await pool.query(query);
        // Se asume que cada fila tiene la propiedad imgart (como string)
        return result.rows.map((row: any) => row.imgart);
    } catch (error) {
        console.error("Error consultando fotos en PostgreSQL:", error);
        return [];
    }
}

async function uploadMissingPhotos(): Promise<void> {
    const ftpConfig = config.ftp;
    const client = new Client();
    client.ftp.verbose = true; // Opcional: para ver logs detallados

    try {
        await client.access({
            host: ftpConfig.host,
            user: ftpConfig.user,
            password: ftpConfig.password,
            secure: false // Ajusta según las necesidades de tu servidor FTP
        });
        console.log("Conectado al servidor FTP.");

        // Asegurarse de que el directorio remoto exista
        await client.ensureDir(ftpConfig.remotePath);
        const remoteFiles = await client.list();
        const remoteFileNames = new Set(remoteFiles.map(file => file.name));

        // Obtiene la lista de fotos desde PostgreSQL
        const fotos = await getFotosFromPostgres();

        for (const fotoPath of fotos) {
            // Se asume que en el campo imgart se almacena la ruta completa al archivo
            const fileName = path.basename(fotoPath);
            if (remoteFileNames.has(fileName)) {
                console.log(`La foto ${fileName} ya existe en el FTP, se omite.`);
                continue;
            }

            if (!fs.existsSync(fotoPath)) {
                console.warn(`El archivo local ${fotoPath} no existe, se omite.`);
                continue;
            }

            console.log(`Subiendo ${fotoPath} a ${ftpConfig.remotePath}/${fileName}...`);
            try {
                await client.uploadFrom(fotoPath, fileName);
                console.log(`Foto ${fileName} subida correctamente.`);
            } catch (uploadError) {
                console.error(`Error subiendo ${fileName}:`, uploadError);
            }
        }
    } catch (error) {
        console.error("Error en la conexión o subida al FTP:", error);
    } finally {
        client.close();
    }
}

export async function syncFotosFTP(): Promise<void> {
    console.log("Iniciando sincronización de fotos al FTP...");
    await uploadMissingPhotos();
    console.log("Sincronización inicial completada.");
}

// Ejecuta la sincronización inicial
syncFotosFTP().catch(error => console.error("Error en la sincronización inicial de fotos:", error));

// Programa un intervalo para ejecutar la sincronización cada minuto (60000 ms)
setInterval(() => {
    console.log("Ejecutando sincronización automática de fotos al FTP...");
    uploadMissingPhotos().catch(error => console.error("Error en la sincronización automática:", error));
}, 60000);
