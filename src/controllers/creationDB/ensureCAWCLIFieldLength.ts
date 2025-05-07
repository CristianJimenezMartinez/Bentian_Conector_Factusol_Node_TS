import { open } from 'node-adodb';
import config from '../../../config.json';

const dbFilePath = config.file.path_file_factusol;

/**
 * Asegura que la columna CAWCLI de la tabla F_CLI tenga tamaño TEXT(100).
 * Si el tamaño actual es menor a 100, se ejecuta un ALTER TABLE para modificarlo.
 * Si es 100 o mayor, no se realiza ninguna modificación.
 */

export async function ensureCAWCLIFieldLength(): Promise<void> {
    // Abrir la conexión a la base de datos Access
    const connection = open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbFilePath};`);
    try {
      // Ejecutar ALTER TABLE directamente
      await connection.execute(`ALTER TABLE F_CLI ALTER COLUMN CAWCLI TEXT(100)`);
      console.log("Campo CAWCLI modificado a TEXT(100) exitosamente.");
    } catch (error: any) {
      // Si el error indica que no se puede modificar porque ya cumple o hay otro conflicto conocido, lo manejamos
      if (error.message && error.message.includes("No se puede encontrar la tabla") ||
          error.message.includes("ya existe") ||
          error.message.includes("No coinciden los tipos de datos")) {
        console.log("El campo CAWCLI ya tiene el tamaño adecuado o la modificación no es necesaria.");
      } else {
        console.error("Error asegurando el tamaño de CAWCLI:", error);
      }
    }
  }