import fs from 'fs';
import ftp from 'basic-ftp';
import pool from '../helpers/pool';
import config from '../../../config.json';
import { sanitize } from '../helpers/helpers';

/**
 * Genera las sentencias SQL para exportar datos desde las tablas relevantes.
 * En este ejemplo se exportan f_cli y f_art; extiéndelo según sea necesario.
 */
async function generateSQLExport(): Promise<string> {
  let sqlStatements = "";
  try {
    // Exportar datos de clientes (f_cli)
    const resCli = await pool.query('SELECT * FROM f_cli');
    for (const row of resCli.rows) {
      sqlStatements += `INSERT INTO f_cli (CUWCLI, CAWCLI, CODCLI, NIFCLI, NOFCLI, NOCCLI, DOMCLI, POBCLI, CPOCLI, PROCLI, TELCLI, EMACLI)
VALUES ('${sanitize(row.cuwcli)}', '${sanitize(row.cawcli)}', ${row.codcli}, '${sanitize(row.nifcli)}', '${sanitize(row.nofcli)}', '${sanitize(row.noccli)}', '${sanitize(row.domcli)}', '${sanitize(row.pobcli)}', '${sanitize(row.cpocli)}', '${sanitize(row.procli)}', '${sanitize(row.telcli)}', '${sanitize(row.emacli)}');\n`;
    }

    // Exportar datos de artículos (f_art)
    const resArt = await pool.query('SELECT * FROM f_art');
    for (const row of resArt.rows) {
      sqlStatements += `INSERT INTO f_art (CODART, EANART, FAMART, DESART, DEWART, TIVART, CP1ART, CP2ART, CP3ART, IMGART, MEWART, CSTART, USTART, SUWART)
VALUES ('${sanitize(row.codart)}', '${sanitize(row.eanart)}', '${sanitize(row.famart)}', '${sanitize(row.desart)}', '${sanitize(row.dewart)}', '${sanitize(row.tivart)}', '${sanitize(row.cp1art)}', '${sanitize(row.cp2art)}', '${sanitize(row.cp3art)}', '${sanitize(row.imgart)}', '${sanitize(row.mewart)}', '${sanitize(row.cstart)}', '${sanitize(row.ustart)}', ${row.suwart});\n`;
    }
  } catch (error) {
    console.error('Error generando SQL export:', error);
    throw error;
  }
  return sqlStatements;
}

/**
 * Genera el archivo SQL de exportación.
 */
async function exportSQLFile(): Promise<string> {
  const sqlContent = await generateSQLExport();
  const fileName = 'factusolweb.sql';
  fs.writeFileSync(fileName, sqlContent, 'utf8');
  console.log('Fichero SQL generado.');
  return fileName;
}

/**
 * Sube el fichero SQL generado al servidor FTP usando basic-ftp.
 */
async function uploadSQLFile(fileName: string): Promise<void> {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    await client.access({
      host: config.ftp.host,
      user: config.ftp.user,
      password: config.ftp.password,
      secure: false
    });
    // Configura la ruta remota (si no está definida, se sube a la raíz)
    const remotePath = config.ftp.remotePath || '/';
    await client.uploadFrom(fileName, remotePath + '/' + fileName);
    console.log('Fichero exportado subido correctamente.');
  } catch (error) {
    console.error('Error subiendo el fichero SQL:', error);
    throw error;
  } finally {
    client.close();
  }
}

/**
 * Función principal que genera el fichero SQL y lo sube vía FTP.
 */
export async function generateAndUploadExport(): Promise<void> {
  try {
    const fileName = await exportSQLFile();
    await uploadSQLFile(fileName);
  } catch (error) {
    console.error('Error en la generación y subida del fichero SQL:', error);
  }
}
