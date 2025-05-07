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
exports.CommentsInPostgres = CommentsInPostgres;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const xml2js_1 = require("xml2js");
const pool_1 = __importDefault(require("../helpers/pool")); // Ajusta la ruta al archivo donde exportas el pool
const config_json_1 = __importDefault(require("../../../config.json"));
const xsdExportFolder = config_json_1.default.xsdExportFolder || './xsd_exports';
/**
 * Parsea un archivo XSD y extrae la información de la tabla y sus columnas.
 * Se busca, dentro del xsd:schema, el xsd:element cuyo atributo name coincida con el nombre del archivo.
 */
function parseXsdFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const xmlContent = fs_1.default.readFileSync(filePath, 'utf8');
            const parser = new xml2js_1.Parser({ explicitArray: false });
            const result = yield parser.parseStringPromise(xmlContent);
            const schema = result['xsd:schema'];
            if (!schema) {
                return null;
            }
            const expectedTableName = path_1.default.basename(filePath, '.xsd');
            let elements = schema['xsd:element'];
            if (!elements) {
                return null;
            }
            if (!Array.isArray(elements)) {
                elements = [elements];
            }
            const tableElement = elements.find((elem) => { var _a; return ((_a = elem.$) === null || _a === void 0 ? void 0 : _a.name) === expectedTableName; });
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
            const columns = [];
            for (const col of columnElements) {
                const colName = (_a = col.$) === null || _a === void 0 ? void 0 : _a.name;
                if (!colName)
                    continue;
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
                            if (((_b = prop.$) === null || _b === void 0 ? void 0 : _b.name) === 'Description' && ((_c = prop.$) === null || _c === void 0 ? void 0 : _c.type) === '10') {
                                comment = prop.$.value;
                                break;
                            }
                        }
                    }
                }
                columns.push({ name: colName, comment });
            }
            return { table: tableName, columns };
        }
        catch (error) {
            console.error(`Error al procesar el archivo ${filePath}:`, error);
            return null;
        }
    });
}
/**
 * Recorre todos los archivos XSD en la carpeta de exportación y devuelve un arreglo
 * con la información de cada tabla (nombre y columnas con sus comentarios).
 */
function processXsdFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        const files = fs_1.default.readdirSync(xsdExportFolder).filter(f => f.endsWith('.xsd'));
        const tableComments = [];
        for (const file of files) {
            const filePath = path_1.default.join(xsdExportFolder, file);
            const tableData = yield parseXsdFile(filePath);
            if (tableData) {
                tableComments.push(tableData);
            }
        }
        return tableComments;
    });
}
/**
 * Conecta a PostgreSQL (usando el pool) y actualiza los comentarios de las columnas en la base de datos Factusol.
 * Se asume que en PostgreSQL las tablas se llaman igual que en el XSD.
 */
function updateCommentsInPostgres(tableComments) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (const tableData of tableComments) {
                const tableName = tableData.table.toLowerCase();
                const tableQualifiedName = `"public"."${tableName}"`;
                const checkRes = yield pool_1.default.query(`SELECT to_regclass($1) as regclass`, [tableQualifiedName]);
                if (!checkRes.rows[0].regclass) {
                    continue;
                }
                let updatedCount = 0;
                for (const col of tableData.columns) {
                    if (col.comment && col.comment.trim() !== '') {
                        const columnName = col.name.toLowerCase();
                        const sql = `COMMENT ON COLUMN ${tableQualifiedName}."${columnName}" IS '${col.comment.replace(/'/g, "''")}';`;
                        yield pool_1.default.query(sql);
                        updatedCount++;
                    }
                }
                console.log(`Comentarios actualizados para ${tableName}: ${updatedCount} columna(s).`);
            }
            console.log("Actualización de comentarios completada.");
        }
        catch (error) {
            console.error("Error actualizando comentarios en Postgres:", error);
        }
    });
}
/**
 * Función principal:
 * 1. Procesa los archivos XSD para extraer la información de tablas y columnas.
 * 2. Actualiza los comentarios en las columnas en PostgreSQL usando el pool.
 */
function CommentsInPostgres() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tableComments = yield processXsdFiles();
            yield updateCommentsInPostgres(tableComments);
        }
        catch (error) {
            console.error("Error en el proceso principal:", error);
        }
    });
}
