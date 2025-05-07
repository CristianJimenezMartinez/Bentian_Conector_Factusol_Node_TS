import fs from 'fs';
import path from 'path';
import { Parser } from 'xml2js';
import pool from '../helpers/pool'; // Ajusta la ruta al archivo donde exportas el pool
import config from '../../../config.json';

const xsdExportFolder = config.xsdExportFolder || './xsd_exports';

interface ColumnComment {
  name: string;
  comment: string;
}

interface TableComments {
  table: string;
  columns: ColumnComment[];
}

/**
 * Parsea un archivo XSD y extrae la información de la tabla y sus columnas.
 * Se busca, dentro del xsd:schema, el xsd:element cuyo atributo name coincida con el nombre del archivo.
 */
async function parseXsdFile(filePath: string): Promise<TableComments | null> {
  try {
    const xmlContent = fs.readFileSync(filePath, 'utf8');
    const parser = new Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlContent);
    const schema = result['xsd:schema'];
    if (!schema) {
      return null;
    }
    const expectedTableName = path.basename(filePath, '.xsd');
    let elements = schema['xsd:element'];
    if (!elements) {
      return null;
    }
    if (!Array.isArray(elements)) {
      elements = [elements];
    }
    const tableElement = elements.find((elem: any) => elem.$?.name === expectedTableName);
    if (!tableElement) {
      return null;
    }
    const tableName = tableElement.$.name;
    const complexType = tableElement['xsd:complexType'];
    if (!complexType) {
      return { table: tableName, columns: [] };
    }
    const sequence = complexType['xsd:sequence'];
    if (!sequence) {
      return { table: tableName, columns: [] };
    }
    let columnElements = sequence['xsd:element'];
    if (!columnElements) {
      return { table: tableName, columns: [] };
    }
    if (!Array.isArray(columnElements)) {
      columnElements = [columnElements];
    }
    const columns: ColumnComment[] = [];
    for (const col of columnElements) {
      const colName = col.$?.name;
      if (!colName) continue;
      let comment = '';
      const annotation = col['xsd:annotation'];
      if (annotation) {
        const appinfo = annotation['xsd:appinfo'];
        if (appinfo && appinfo['od:fieldProperty']) {
          let fieldProps = appinfo['od:fieldProperty'];
          if (!Array.isArray(fieldProps)) {
            fieldProps = [fieldProps];
          }
          for (const prop of fieldProps) {
            if (prop.$?.name === 'Description' && prop.$?.type === '10') {
              comment = prop.$.value;
              break;
            }
          }
        }
      }
      columns.push({ name: colName, comment });
    }
    return { table: tableName, columns };
  } catch (error) {
    console.error(`Error al procesar el archivo ${filePath}:`, error);
    return null;
  }
}

/**
 * Recorre todos los archivos XSD en la carpeta de exportación y devuelve un arreglo
 * con la información de cada tabla (nombre y columnas con sus comentarios).
 */
async function processXsdFiles(): Promise<TableComments[]> {
  const files = fs.readdirSync(xsdExportFolder).filter(f => f.endsWith('.xsd'));
  const tableComments: TableComments[] = [];
  for (const file of files) {
    const filePath = path.join(xsdExportFolder, file);
    const tableData = await parseXsdFile(filePath);
    if (tableData) {
      tableComments.push(tableData);
    }
  }
  return tableComments;
}

/**
 * Conecta a PostgreSQL (usando el pool) y actualiza los comentarios de las columnas en la base de datos Factusol.
 * Se asume que en PostgreSQL las tablas se llaman igual que en el XSD.
 */
async function updateCommentsInPostgres(tableComments: TableComments[]) {
  try {
    for (const tableData of tableComments) {
      const tableName = tableData.table.toLowerCase();
      const tableQualifiedName = `"public"."${tableName}"`;
      const checkRes = await pool.query(
        `SELECT to_regclass($1) as regclass`, [tableQualifiedName]
      );
      if (!checkRes.rows[0].regclass) {
        continue;
      }
      let updatedCount = 0;
      for (const col of tableData.columns) {
        if (col.comment && col.comment.trim() !== '') {
          const columnName = col.name.toLowerCase();
          const sql = `COMMENT ON COLUMN ${tableQualifiedName}."${columnName}" IS '${col.comment.replace(/'/g, "''")}';`;
          await pool.query(sql);
          updatedCount++;
        }
      }
      console.log(`Comentarios actualizados para ${tableName}: ${updatedCount} columna(s).`);
    }
    console.log("Actualización de comentarios completada.");
  } catch (error) {
    console.error("Error actualizando comentarios en Postgres:", error);
  }
}

/**
 * Función principal:
 * 1. Procesa los archivos XSD para extraer la información de tablas y columnas.
 * 2. Actualiza los comentarios en las columnas en PostgreSQL usando el pool.
 */
export async function CommentsInPostgres() {
  try {
    const tableComments = await processXsdFiles();
    await updateCommentsInPostgres(tableComments);
  } catch (error) {
    console.error("Error en el proceso principal:", error);
  }
}
