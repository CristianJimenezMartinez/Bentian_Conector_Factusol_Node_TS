import { open } from 'node-adodb';
import config from '../../../config.json';

const dbFilePath = config.file.path_file_factusol;

/**
 * Lee los datos de la tabla especificada.
 * Si la tabla no existe (según el mensaje de error), retorna un array vacío.
 */
export async function readTableData(tableName: string): Promise<any[]> {
  const connection = open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbFilePath};Persist Security Info=False;`);
  try {
    const query = `SELECT * FROM ${tableName}`;
    const result = await connection.query(query);
    return result as any[];
  } catch (error: any) {
    const errMsg: string = error.message || '';
    // Verificamos si el mensaje indica que no se encontró la tabla
    if (errMsg.toLowerCase().includes('no puede encontrar') && errMsg.toLowerCase().includes(tableName.toLowerCase())) {
      console.warn(`La tabla ${tableName} no existe. Se omite esta operación.`);
      return [];
    }
    // Si es otro error, lo relanzamos
    throw error;
  }
}
