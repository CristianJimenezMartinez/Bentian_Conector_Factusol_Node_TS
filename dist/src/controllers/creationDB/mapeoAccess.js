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
exports.getTableColumns = getTableColumns;
exports.mapAccessToPostgresWithPool = mapAccessToPostgresWithPool;
exports.main = main;
const fs_1 = __importDefault(require("fs"));
const node_adodb_1 = require("node-adodb");
const helpers_1 = require("../helpers/helpers");
const dotenv_1 = __importDefault(require("dotenv"));
const config_json_1 = __importDefault(require("../../../config.json"));
const tableOrders_1 = __importDefault(require("../constants/tableOrders")); // Archivo con las columnas de cada tabla
const pool_1 = __importDefault(require("../helpers/pool")); // Importa el pool configurado
dotenv_1.default.config();
const dbFilePath = config_json_1.default.file.path_file_factusol;
// Definición de accessToPostgresMap (puedes ampliar el mapeo si conoces los DATA_TYPE de Access)
const accessToPostgresMap = {
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
const tableOrders = tableOrders_1.default;
/**
 * Mapea un tipo de dato de Access a PostgreSQL.
 */
function mapAccessTypeToPostgres(accessType, size) {
    const typeKey = accessType.toLowerCase();
    const mapper = accessToPostgresMap[typeKey];
    return mapper ? mapper(size) : 'TEXT';
}
/**
 * Obtiene la lista de columnas a partir de los metadatos del esquema de la tabla en Access,
 * usando el método schema(4) (que corresponde a adSchemaColumns).
 */
function getTableColumns(tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connection = (0, node_adodb_1.open)(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${config_json_1.default.file.path_file_factusol};Persist Security Info=False;`);
            const schemaColumns = yield connection.schema(4, [tableName]);
            if (schemaColumns && schemaColumns.length > 0) {
                return schemaColumns.map(col => {
                    const colName = (0, helpers_1.safeValue)(col.COLUMN_NAME) || "";
                    return {
                        name: colName,
                        type: 'TEXT',
                        comment: `Columna ${colName}`
                    };
                });
            }
            return [];
        }
        catch (error) {
            console.error(`Error obteniendo esquema para la tabla ${tableName}:`, error);
            const fallbackOrder = tableOrders[tableName.toLowerCase()];
            if (fallbackOrder && fallbackOrder.length > 0) {
                return fallbackOrder.map(col => ({ name: col, type: 'TEXT', comment: `Columna ${col}` }));
            }
            return [];
        }
    });
}
/**
 * Verifica si una columna existe en una tabla y, de no existir, la añade.
 */
function ensureColumnExists(client, tableName, columnName, columnDefinition) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`, [tableName.toLowerCase(), columnName.toLowerCase()]);
            if (result.rows.length === 0) {
                yield client.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
            }
        }
        catch (error) {
            console.error(`Error al asegurar la columna ${columnName} en ${tableName}:`, error);
            throw error;
        }
    });
}
/**
 * Asegura que las columnas obtenidas de Access existan en la tabla de PostgreSQL.
 */
function ensureColumns(client, tableName, columns) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const col of columns) {
            yield ensureColumnExists(client, tableName.toLowerCase(), col.name.toLowerCase(), col.type);
        }
    });
}
/**
 * Verifica si una tabla existe en PostgreSQL y, de no existir, la crea con un esquema fallback basado en tableOrders.
 */
function ensureTableExists(client, tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        const tableKey = tableName.toLowerCase();
        const res = yield client.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`, [tableKey]);
        if (res.rows.length === 0) {
            const order = tableOrders[tableKey];
            if (order) {
                const fallbackCols = order.map(col => `${col} TEXT`).join(", ");
                const createSQL = `CREATE TABLE IF NOT EXISTS ${tableKey} (${fallbackCols});`;
                yield client.query(createSQL);
            }
            else {
                console.warn(`No se dispone de orden definido para la tabla ${tableKey}. No se puede crear esquema fallback.`);
            }
        }
    });
}
/**
 * Mapea el archivo Access y crea las tablas correspondientes en PostgreSQL usando el pool principal.
 */
function mapAccessToPostgresWithPool(poolMain) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const dbFile = fs_1.default.readFileSync(config_json_1.default.file.path_file_factusol);
            const tablas = [
                "F_CFG", "F_CLI", "F_AGE", "F_ART", "F_FAM", "F_SEC",
                "F_TAR", "F_LTA", "F_DES", "F_FAC", "F_LFA", "F_FPA", "F_ALM",
                "F_PCL", "F_LPC", "F_STO", "F_EMP", "F_UME"
            ];
            for (const table of tablas) {
                try {
                    let columns = yield getTableColumns(table);
                    if (columns.length === 0) {
                        continue;
                    }
                    const tableKey = table.toLowerCase();
                    if (tableOrders_1.default[tableKey]) {
                        const order = tableOrders_1.default[tableKey];
                        const columnsMap = new Map();
                        for (const col of columns) {
                            const key = (0, helpers_1.safeValue)(col.name).toLowerCase();
                            if (!columnsMap.has(key)) {
                                columnsMap.set(key, col);
                            }
                        }
                        const orderedColumns = [];
                        for (const colName of order) {
                            if (columnsMap.has(colName)) {
                                orderedColumns.push(columnsMap.get(colName));
                            }
                            else {
                                orderedColumns.push({ name: colName, type: 'TEXT', comment: `Columna ${colName}` });
                            }
                        }
                        // Se descartan todas las columnas que no estén definidas en tableOrders
                        columns = orderedColumns;
                    }
                    let createSQL = `CREATE TABLE IF NOT EXISTS ${table.toLowerCase()} (`;
                    const columnsSQL = columns.map(col => `${(0, helpers_1.safeValue)(col.name).toLowerCase()} ${col.type}`);
                    createSQL += columnsSQL.join(", ") + ");";
                    try {
                        yield poolMain.query(createSQL);
                    }
                    catch (createError) {
                        continue;
                    }
                    try {
                        yield ensureColumns(poolMain, table, columns);
                    }
                    catch (ensureError) {
                        // Se ignora para continuar con la siguiente tabla
                    }
                    console.log(`Sincronización completada para ${table}.`);
                }
                catch (error) {
                    console.error(`Error procesando la tabla ${table}:`, error);
                }
            }
            for (const table of tablas) {
                try {
                    yield ensureTableExists(poolMain, table.toLowerCase());
                }
                catch (error) {
                    console.error(`Error asegurando existencia de la tabla ${table}:`, error);
                }
            }
            // Aquí se llaman las actualizaciones específicas a ciertas columnas
            yield updateColumnModifications(poolMain);
            console.log("Sincronización completa y conexión cerrada.");
        }
        catch (error) {
            console.error("Error en el proceso de mapeo:", error);
        }
    });
}
/**
 * Función para actualizar la definición de ciertas columnas específicas.
 * Se ejecuta al final del proceso.
 */
function updateColumnModifications(client) {
    return __awaiter(this, void 0, void 0, function* () {
        // Define las modificaciones necesarias
        const modifications = [
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
                yield client.query(alterQuery);
                console.log(`Columna ${mod.column} en ${mod.table} actualizada a ${mod.definition}`);
            }
            catch (error) {
                console.error(`Error actualizando ${mod.table}.${mod.column}:`, error);
            }
        }
    });
}
/**
 * Función principal para iniciar el proceso:
 * Espera hasta que Factusol esté disponible y finalmente mapea Access.
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mapAccessToPostgresWithPool(pool_1.default);
        }
        catch (error) {
            console.error("Error en el proceso de mapeo:", error);
        }
        finally {
            // Aquí podrías cerrar conexiones si fuera necesario
        }
    });
}
