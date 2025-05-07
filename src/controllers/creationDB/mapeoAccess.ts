import fs from 'fs';
import adodb, { open } from 'node-adodb';
import { safeValue } from '../helpers/helpers';
import dotenv from 'dotenv';
import config from '../../../config.json';
import tableOrder from '../constants/tableOrders'; // Archivo con las columnas de cada tabla
import pool from '../helpers/pool'; // Importa el pool configurado

dotenv.config();

const dbFilePath = config.file.path_file_factusol;

// Definición de accessToPostgresMap (puedes ampliar el mapeo si conoces los DATA_TYPE de Access)
const accessToPostgresMap: Record<string, (size?: number) => string> = {
  'varchar': size => size ? `VARCHAR(${size})` : 'VARCHAR(255)',
  'memo': () => 'TEXT',
  'text': size => size ? `VARCHAR(${size})` : 'VARCHAR(255)',
  'integer': () => 'INTEGER',
  'number': () => 'DECIMAL(18,2)',
  'double': () => 'DOUBLE PRECISION',
  'datetime': () => 'TIMESTAMP',
  'yesno': () => 'BOOLEAN',
  'autonumber': () => 'SERIAL',
};

// Definición de los órdenes de columnas por tabla (en minúsculas)
const tableOrders: Record<string, string[]> = tableOrder;

/**
 * Mapea un tipo de dato de Access a PostgreSQL.
 */
function mapAccessTypeToPostgres(accessType: string, size?: number): string {
  const typeKey = accessType.toLowerCase();
  const mapper = accessToPostgresMap[typeKey];
  return mapper ? mapper(size) : 'TEXT';
}

/**
 * Obtiene la lista de columnas a partir de los metadatos del esquema de la tabla en Access,
 * usando el método schema(4) (que corresponde a adSchemaColumns).
 */
export async function getTableColumns(tableName: string): Promise<{ name: string, type: string, comment: string }[]> {
  try {
    const connection = open(
      `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${config.file.path_file_factusol};Persist Security Info=False;`
    );
    const schemaColumns: any[] = await connection.schema(4, [tableName]);
    if (schemaColumns && schemaColumns.length > 0) {
      return schemaColumns.map(col => {
        const colName = safeValue(col.COLUMN_NAME) || "";
        return {
          name: colName,
          type: 'TEXT',
          comment: `Columna ${colName}`
        };
      });
    }
    return [];
  } catch (error) {
    console.error(`Error obteniendo esquema para la tabla ${tableName}:`, error);
    const fallbackOrder = tableOrders[tableName.toLowerCase()];
    if (fallbackOrder && fallbackOrder.length > 0) {
      return fallbackOrder.map(col => ({ name: col, type: 'TEXT', comment: `Columna ${col}` }));
    }
    return [];
  }
}

/**
 * Verifica si una columna existe en una tabla y, de no existir, la añade.
 */
async function ensureColumnExists(
  client: any,
  tableName: string,
  columnName: string,
  columnDefinition: string
): Promise<void> {
  try {
    const result = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
      [tableName.toLowerCase(), columnName.toLowerCase()]
    );
    if (result.rows.length === 0) {
      await client.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  } catch (error) {
    console.error(`Error al asegurar la columna ${columnName} en ${tableName}:`, error);
    throw error;
  }
}

/**
 * Asegura que las columnas obtenidas de Access existan en la tabla de PostgreSQL.
 */
async function ensureColumns(client: any, tableName: string, columns: { name: string, type: string, comment: string }[]): Promise<void> {
  for (const col of columns) {
    await ensureColumnExists(client, tableName.toLowerCase(), col.name.toLowerCase(), col.type);
  }
}

/**
 * Verifica si una tabla existe en PostgreSQL y, de no existir, la crea con un esquema fallback basado en tableOrders.
 */
async function ensureTableExists(client: any, tableName: string): Promise<void> {
  const tableKey = tableName.toLowerCase();
  const res = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [tableKey]
  );
  if (res.rows.length === 0) {
    const order = tableOrders[tableKey];
    if (order) {
      const fallbackCols = order.map(col => `${col} TEXT`).join(", ");
      const createSQL = `CREATE TABLE IF NOT EXISTS ${tableKey} (${fallbackCols});`;
      await client.query(createSQL);
    } else {
      console.warn(`No se dispone de orden definido para la tabla ${tableKey}. No se puede crear esquema fallback.`);
    }
  }
}

/**
 * Mapea el archivo Access y crea las tablas correspondientes en PostgreSQL usando el pool principal.
 */
export async function mapAccessToPostgresWithPool(poolMain: typeof pool): Promise<void> {
  try {
    const dbFile = fs.readFileSync(config.file.path_file_factusol);
    const tablas: string[] = [
      "F_CFG", "F_CLI", "F_AGE", "F_ART", "F_FAM", "F_SEC", 
      "F_TAR", "F_LTA", "F_DES", "F_FAC", "F_LFA", "F_FPA", "F_ALM", 
      "F_PCL", "F_LPC", "F_STO", "F_EMP", "F_UME"
    ];

    for (const table of tablas) {
      try {
        let columns = await getTableColumns(table);
        if (columns.length === 0) {
          continue;
        }
        const tableKey = table.toLowerCase();
        if (tableOrder[tableKey]) {
          const order = tableOrder[tableKey];
          const columnsMap: Map<string, { name: string, type: string, comment: string }> = new Map();
          for (const col of columns) {
            const key = safeValue(col.name).toLowerCase();
            if (!columnsMap.has(key)) {
              columnsMap.set(key, col);
            }
          }
          const orderedColumns: { name: string, type: string, comment: string }[] = [];
          for (const colName of order) {
            if (columnsMap.has(colName)) {
              orderedColumns.push(columnsMap.get(colName)!);
            } else {
              orderedColumns.push({ name: colName, type: 'TEXT', comment: `Columna ${colName}` });
            }
          }
          // Se descartan todas las columnas que no estén definidas en tableOrders
          columns = orderedColumns;
        }

        let createSQL = `CREATE TABLE IF NOT EXISTS ${table.toLowerCase()} (`;
        const columnsSQL = columns.map(col => `${safeValue(col.name).toLowerCase()} ${col.type}`);
        createSQL += columnsSQL.join(", ") + ");";

        try {
          await poolMain.query(createSQL);
        } catch (createError) {
          continue;
        }

        try {
          await ensureColumns(poolMain, table, columns);
        } catch (ensureError) {
          // Se ignora para continuar con la siguiente tabla
        }

        console.log(`Sincronización completada para ${table}.`);
      } catch (error) {
        console.error(`Error procesando la tabla ${table}:`, error);
      }
    }

    for (const table of tablas) {
      try {
        await ensureTableExists(poolMain, table.toLowerCase());
      } catch (error) {
        console.error(`Error asegurando existencia de la tabla ${table}:`, error);
      }
    }

    // Aquí se llaman las actualizaciones específicas a ciertas columnas
    await updateColumnModifications(poolMain);

    console.log("Sincronización completa y conexión cerrada.");
  } catch (error) {
    console.error("Error en el proceso de mapeo:", error);
  }
}

/**
 * Función para actualizar la definición de ciertas columnas específicas.
 * Se ejecuta al final del proceso.
 */
async function updateColumnModifications(client: any): Promise<void> {
  // Define las modificaciones necesarias
  const modifications: { table: string, column: string, definition: string }[] = [
    { table: "f_lfa", column: "deslfa", definition: "VARCHAR(255)" },
    { table: "f_fpa", column: "codfpa", definition: "VARCHAR(3)" },
    { table: "f_fac", column: "agefac", definition: "VARCHAR(255)" },
    { table: "f_fac", column: "clifac", definition: "VARCHAR(255)" },
    { table: "f_fac", column: "cpofac", definition: "VARCHAR(30)" },
    { table: "f_fac", column: "cprfac", definition: "VARCHAR(40)" },
    { table: "f_fac", column: "telfac", definition: "VARCHAR(50)" },
    { table: "f_fac", column: "reffac", definition: "VARCHAR(50)" },
    { table: "f_art", column: "eanart", definition: "VARCHAR(50)" },
    { table: "f_art", column: "imgart", definition: "VARCHAR(255)" },
    { table: "f_cli", column: "codcli", definition: "VARCHAR(255)" },
    { table: "f_cli", column: "nofcli", definition: "VARCHAR(255)" },
    { table: "f_cli", column: "noccli", definition: "VARCHAR(255)" },
    { table: "f_cli", column: "domcli", definition: "VARCHAR(255)" },
  ];

  for (const mod of modifications) {
    const alterQuery = `ALTER TABLE "${mod.table}" ALTER COLUMN "${mod.column}" TYPE ${mod.definition};`;
    try {
      await client.query(alterQuery);
      console.log(`Columna ${mod.column} en ${mod.table} actualizada a ${mod.definition}`);
    } catch (error) {
      console.error(`Error actualizando ${mod.table}.${mod.column}:`, error);
    }
  }
}

/**
 * Función principal para iniciar el proceso:
 * Espera hasta que Factusol esté disponible y finalmente mapea Access.
 */
export async function main(): Promise<void> {
  try {
    await mapAccessToPostgresWithPool(pool);
  } catch (error) {
    console.error("Error en el proceso de mapeo:", error);
  } finally {
    // Aquí podrías cerrar conexiones si fuera necesario
  }
}
