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
exports.getData = getData;
const node_adodb_1 = require("node-adodb");
const config_json_1 = __importDefault(require("../../../config.json"));
const dotenv_1 = __importDefault(require("dotenv"));
// Asegúrate de que el archivo se llame "tableOrders.ts" (o la ruta sea correcta)
// y de exportar "tableOrders" tal cual. Por ejemplo:
// export const tableOrders: Record<string, string[]> = { ... };
const tableOrders_1 = require("../constants/tableOrders");
const pool_1 = __importDefault(require("../helpers/pool"));
dotenv_1.default.config();
const dbFilePath = config_json_1.default.file.path_file_factusol;
// Arreglo de tablas a sincronizar según Factusol.
// Verifica que este arreglo respete la dependencia de claves foráneas (padres antes que hijos).
const tablas = [
    "F_CFG", "F_CLI", "F_AGE", "F_SEC", "F_FAM", "F_ART",
    "F_TAR", "F_LTA", "F_DES", "F_FAC", "F_LFA", "F_FPA", "F_ALM",
    "F_PCL", "F_LPC", "F_STO", "F_EMP", "F_UME"
];
// Mapeo de claves primarias para cada tabla (usando nombres en minúsculas)
const primaryKeyMapping = {
    f_cfg: ['codcfg'],
    f_sec: ['codsec'],
    f_fam: ['codfam'],
    f_cli: ['codcli'],
    f_art: ['codart'],
    f_age: ['codage'],
    f_tar: ['codtar'],
    f_lta: ['tarlta', 'artlta'],
    f_des: ['tipdes', 'artdes'],
    f_fac: ['codfac'],
    f_lfa: ['codlfa', 'poslfa'],
    f_fpa: ['codfpa'],
    f_alm: ['codalm'],
    f_pcl: ['codpcl'],
    f_lpc: ['codlpc', 'poslpc'],
    f_sto: ['artsto', 'almsto'],
    f_emp: ['codemp'],
    f_ume: ['codume']
};
/**
 * Función extractOleText: Extrae el texto útil del buffer OLE.
 * Se asume que el header OLE tiene 78 bytes (puede variar según el caso).
 */
function extractOleText(buffer) {
    const headerSize = 78;
    if (buffer.length <= headerSize) {
        return buffer.toString('latin1');
    }
    const textBuffer = buffer.slice(headerSize);
    const nullIndex = textBuffer.indexOf(0);
    if (nullIndex !== -1) {
        return textBuffer.slice(0, nullIndex).toString('latin1').trim();
    }
    return textBuffer.toString('latin1').trim();
}
/**
 * Función safeValue: procesa el valor leído desde Access.
 * Si el valor es un Buffer se intenta extraer el texto ignorando el header OLE.
 */
function safeValue(value) {
    if (value === undefined || value === null) {
        return value;
    }
    if (Buffer.isBuffer(value)) {
        try {
            return extractOleText(value);
        }
        catch (error) {
            return value.toString('latin1');
        }
    }
    return value;
}
/**
 * Función para leer datos desde Access.
 * Para F_FAM y F_SEC se usa una consulta especial; para el resto se utiliza SELECT *.
 */
function readFileAccess(tabla_1, processChunk_1) {
    return __awaiter(this, arguments, void 0, function* (tabla, processChunk, chunkSize = 2000) {
        const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbFilePath};Persist Security Info=False;`;
        const connection = (0, node_adodb_1.open)(connectionString);
        let query = '';
        if (tabla.toUpperCase() === "F_FAM") {
            query = `
      SELECT CODFAM, DESFAM, SECFAM, TEXFAM, CUEFAM, CUCFAM, SUWFAM, IMFFAM, MPTFAM, PFIFAM, ORDFAM, RTIFAM, DEPFAM, SDEFAM 
      FROM F_FAM
    `;
        }
        else if (tabla.toUpperCase() === "F_SEC") {
            query = `
      SELECT CODSEC, DESSEC, SUWSEC, MPTSEC, ORDSEC
      FROM F_SEC
    `;
        }
        else {
            query = `SELECT * FROM ${tabla}`;
        }
        try {
            const result = yield connection.query(query);
            const chunkPromises = [];
            for (let i = 0; i < result.length; i += chunkSize) {
                const chunk = result.slice(i, i + chunkSize);
                chunkPromises.push(processChunk(chunk));
            }
            yield Promise.all(chunkPromises);
            // Liberar memoria si Node.js está corriendo con --expose-gc
            if (global.gc) {
                global.gc();
            }
        }
        catch (error) {
            console.error(`Error al leer la tabla ${tabla}:`, error);
        }
    });
}
/**
 * Función auxiliar que devuelve los valores de la fila ordenados según el arreglo dado.
 * Se asume que las claves en la fila están en mayúsculas.
 */
function getOrderedValues(row, order) {
    return order.map((col) => safeValue(row[col.toUpperCase()]));
}
/**
 * Función genérica para actualizar o insertar datos en la base de datos utilizando el pool.
 * Se procesa fila a fila. Los valores se obtienen siempre en el mismo orden definido en tableOrders,
 * garantizando así que las sentencias INSERT/UPDATE tengan el orden correcto.
 */
function upsertDataGeneric(tableName, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const tableKey = tableName.toLowerCase();
        const columns = tableOrders_1.tableOrders[tableKey];
        if (!columns) {
            console.warn(`No se definió orden de columnas para la tabla ${tableName}`);
            return;
        }
        const pkColumns = primaryKeyMapping[tableKey] || [];
        if (data.length === 0)
            return;
        let insertedCount = 0;
        let updatedCount = 0;
        for (const row of data) {
            let exists = false;
            let pkValues = [];
            let whereConditions = '';
            if (pkColumns.length > 0) {
                whereConditions = pkColumns.map((col, i) => `${col} = $${i + 1}`).join(' AND ');
                pkValues = getOrderedValues(row, pkColumns);
                try {
                    const queryResult = yield pool_1.default.query(`SELECT * FROM ${tableKey} WHERE ${whereConditions}`, pkValues);
                    if (queryResult.rows && queryResult.rows.length > 0) {
                        exists = true;
                    }
                }
                catch (err) {
                    console.error(`Error al verificar existencia en ${tableName}:`, err);
                }
            }
            if (exists) {
                const columnsToUpdate = columns.filter((col) => !pkColumns.includes(col));
                const setClause = columnsToUpdate
                    .map((col, index) => `${col} = $${index + 1}`)
                    .join(', ');
                const whereClause = pkColumns
                    .map((col, index) => `${col} = $${columnsToUpdate.length + index + 1}`)
                    .join(' AND ');
                const updateValues = getOrderedValues(row, columnsToUpdate);
                const allValues = updateValues.concat(pkValues);
                const updateQuery = `UPDATE ${tableKey} SET ${setClause} WHERE ${whereClause}`;
                try {
                    yield pool_1.default.query(updateQuery, allValues);
                    updatedCount++;
                }
                catch (err) {
                    console.error(`Error actualizando fila en ${tableName}:`, err);
                }
            }
            else {
                const values = getOrderedValues(row, columns);
                const columnsSQL = columns.join(', ');
                const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
                const insertQuery = `INSERT INTO ${tableKey} (${columnsSQL}) VALUES (${placeholders})`;
                try {
                    yield pool_1.default.query(insertQuery, values);
                    insertedCount++;
                }
                catch (err) {
                    console.error(`Error insertando fila en ${tableName}:`, err);
                }
            }
        }
        console.log(`Sincronización final para ${tableName}: ${insertedCount} insertados, ${updatedCount} actualizados.`);
    });
}
/**
 * Función principal que recorre cada tabla, lee los datos de Access y los inserta o actualiza en PostgreSQL.
 * Se pueden procesar las tablas de forma secuencial en el orden del array "tablas"
 * para respetar las claves foráneas (padres antes que hijos).
 */
function getData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Si necesitas procesar las tablas secuencialmente para evitar problemas de FK, 
            // reemplaza Promise.all por un bucle for...of. Ejemplo:
            for (const tabla of tablas) {
                yield readFileAccess(tabla, (chunk) => __awaiter(this, void 0, void 0, function* () {
                    yield upsertDataGeneric(tabla, chunk);
                }));
                console.log(`Sincronización completada para ${tabla}.`);
            }
            // O si no tienes dependencias de FK crítico, podrías hacer:
            // await Promise.all(tablas.map(async (tabla) => {
            //   await readFileAccess(tabla, async (chunk: any[]) => {
            //     await upsertDataGeneric(tabla, chunk);
            //   });
            //   console.log(`Sincronización completada para ${tabla}.`);
            // }));
        }
        catch (error) {
            console.error("Error en la sincronización:", error);
        }
    });
}
