"use strict";
// src/controllers/invoicesController.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.createInvoice = createInvoice;
exports.updateFacturaEstado = updateFacturaEstado;
exports.createInvoiceForOrder = createInvoiceForOrder;
const pool_1 = __importDefault(require("./helpers/pool"));
const node_adodb_1 = require("node-adodb");
const config_json_1 = __importDefault(require("../../config.json"));
const generateInvoicePDF_1 = require("../utils/generateInvoicePDF");
const fs = __importStar(require("fs"));
const dbFilePath = config_json_1.default.file.path_file_factusol;
const sanitize = (str) => String(str !== null && str !== void 0 ? str : '').replace(/'/g, "''");
// ***** Helpers para Access *****
const getAccessConnection = () => {
    console.log(`Abriendo conexión a Access con Data Source: ${dbFilePath}`);
    return (0, node_adodb_1.open)(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbFilePath};`);
};
/**
 * Inserta la factura en Access en las tablas F_FAC (cabecera) y F_LFA (líneas).
 */
function insertInvoiceIntoAccessDB(cabecera, lineas, facturaId) {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = getAccessConnection();
        // Fecha local YYYY-MM-DD
        const dateObj = new Date(cabecera.fecfac);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const accessDate = `#${year}-${month}-${day}#`;
        // Preparar valores
        const almfacVal = cabecera.almfac ? `'${sanitize(cabecera.almfac)}'` : 'NULL';
        const agefacVal = cabecera.agefac ? `${Number(cabecera.agefac)}` : 'NULL';
        const clifacVal = cabecera.clifac ? `${Number(cabecera.clifac)}` : 'NULL';
        const cnofacVal = cabecera.cnofac ? `'${sanitize(cabecera.cnofac)}'` : 'NULL';
        const cdofacVal = cabecera.cdofac ? `'${sanitize(cabecera.cdofac)}'` : 'NULL';
        const cpofacVal = cabecera.cpofac ? `'${sanitize(cabecera.cpofac)}'` : 'NULL';
        const ccpfacVal = cabecera.ccpfac ? `'${sanitize(cabecera.ccpfac)}'` : 'NULL';
        const cprfacVal = cabecera.cprfac ? `'${sanitize(cabecera.cprfac)}'` : 'NULL';
        const telfacVal = cabecera.telfac ? `'${sanitize(cabecera.telfac)}'` : 'NULL';
        const cemfacVal = cabecera.cemfac ? `'${sanitize(cabecera.cemfac)}'` : 'NULL';
        const cpafacVal = cabecera.cpafac ? `'${sanitize(cabecera.cpafac)}'` : 'NULL';
        const ipor1facVal = cabecera.ipor1fac != null ? `${Number(cabecera.ipor1fac)}` : '0';
        const iiva1facVal = cabecera.iiva1fac != null ? `${Number(cabecera.iiva1fac)}` : '0';
        const net1facVal = cabecera.net1fac != null ? `${Number(cabecera.net1fac)}` : '0';
        const totfacVal = cabecera.totfac != null ? `${Number(cabecera.totfac)}` : '0';
        // INSERT cabecera en Access
        const cabeceraSQL = `
    INSERT INTO F_FAC (
      tipfac, codfac, reffac, fecfac, estfac, almfac, agefac, clifac,
      cnofac, cdofac, cpofac, ccpfac, cprfac, telfac, cemfac, cpafac,
      ipor1fac, iiva1fac, net1fac, totfac
    ) VALUES (
      '${sanitize(cabecera.tipfac)}',
      ${facturaId},
      '${sanitize(cabecera.reffac)}',
      ${accessDate},
      '${sanitize(cabecera.estfac)}',
      ${almfacVal},
      ${agefacVal},
      ${clifacVal},
      ${cnofacVal},
      ${cdofacVal},
      ${cpofacVal},
      ${ccpfacVal},
      ${cprfacVal},
      ${telfacVal},
      ${cemfacVal},
      ${cpafacVal},
      ${ipor1facVal},
      ${iiva1facVal},
      ${net1facVal},
      ${totfacVal}
    )
  `;
        console.log('[Access] Ejecutando cabecera:', cabeceraSQL.trim());
        yield connection.execute(cabeceraSQL);
        // INSERT líneas en Access
        for (const linea of lineas) {
            const poslfaVal = Number(linea.poslfa) || 0;
            const canlfaVal = Number(linea.canlfa) || 0;
            const prelfaVal = Number(linea.prelfa) || 0;
            const totlfaVal = Number(linea.totlfa) || 0;
            const lineaSQL = `
      INSERT INTO F_LFA (
        tiplfa, codlfa, poslfa, artlfa, deslfa, canlfa, prelfa, totlfa
      ) VALUES (
        '${sanitize(linea.tiplfa)}',
        ${facturaId},
        ${poslfaVal},
        '${sanitize(linea.artlfa)}',
        '${sanitize(linea.deslfa)}',
        ${canlfaVal},
        ${prelfaVal},
        ${totlfaVal}
      )
    `;
            console.log('[Access] Ejecutando línea:', lineaSQL.trim());
            yield connection.execute(lineaSQL);
        }
    });
}
/**
 * Actualiza el estado de la factura en Access.
 */
function updateInvoiceStatusInAccessDB(codfac, nuevoEstado) {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = getAccessConnection();
        try {
            const sql = `UPDATE F_FAC SET estfac = '${nuevoEstado}' WHERE codfac = ${codfac}`;
            console.log(`Ejecutando SQL en Access para actualizar estado: ${sql.trim()}`);
            yield connection.execute(sql);
        }
        catch (error) {
            console.error('Error updating invoice state in Access database:', error);
            throw error;
        }
    });
}
/**
 * Obtiene el siguiente ID de factura consultando en PostgreSQL y Access.
 */
function getNextInvoiceId() {
    return __awaiter(this, void 0, void 0, function* () {
        let pgMax = 0, accessMax = 0;
        try {
            console.log("Consultando máximo codfac en PostgreSQL...");
            const pgResult = yield pool_1.default.query("SELECT COALESCE(MAX(codfac), 0) AS maxid FROM f_fac");
            pgMax = parseInt(pgResult.rows[0].maxid);
            console.log(`Máximo codfac en PostgreSQL: ${pgMax}`);
        }
        catch (error) {
            console.error("Error obteniendo el máximo ID en PostgreSQL:", error);
        }
        const connection = getAccessConnection();
        try {
            console.log("Consultando máximo codfac en Access...");
            const result = yield connection.query("SELECT MAX(codfac) AS maxid FROM F_FAC");
            if (result && result.length > 0 && result[0].maxid !== null) {
                accessMax = parseInt(result[0].maxid);
            }
            console.log(`Máximo codfac en Access: ${accessMax}`);
        }
        catch (error) {
            console.error("Error obteniendo el máximo ID en Access:", error);
        }
        const newId = Math.max(pgMax, accessMax) + 1;
        console.log(`Nuevo ID de factura calculado: ${newId}`);
        return newId;
    });
}
// ***** Funcionalidad de Facturación en PostgreSQL *****
// SQL PostgreSQL
const INSERT_HEADER_PG = `
  INSERT INTO f_fac (
    tipfac, codfac, reffac, fecfac, estfac, almfac, agefac, clifac,
    cnofac, cdofac, cpofac, ccpfac, cprfac, telfac, ipor1fac, tivfac,
    iiva1fac, piva1fac, piva2fac, piva3fac, net1fac, totfac
  ) VALUES (
    $1,  $2,     $3,      $4,      $5,     $6,      $7,      $8,
    $9,  $10,    $11,     $12,     $13,    $14,     $15,     $16,
    $17,  $18,    $19,     $20,     $21,     $22
  )
`;
const INSERT_LINE_PG = `
  INSERT INTO f_lfa (tiplfa, codlfa, poslfa, artlfa, deslfa, canlfa, prelfa, totlfa)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
`;
/**
 * Crea una factura de forma manual usando datos enviados en el body.
 */
function createInvoice(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { cabecera, lineas } = req.body;
        if (!cabecera || !lineas || !Array.isArray(lineas)) {
            res.status(400).json({ error: 'Datos de cabecera y líneas son requeridos' });
            return;
        }
        try {
            const pgHeaderResult = yield pool_1.default.query({
                text: INSERT_HEADER_PG + " RETURNING codfac",
                values: [
                    cabecera.tipfac,
                    cabecera.codfac,
                    cabecera.reffac,
                    cabecera.fecfac,
                    cabecera.estfac,
                    cabecera.almfac,
                    cabecera.agefac,
                    cabecera.clifac,
                    cabecera.cnofac,
                    cabecera.cdofac,
                    cabecera.cpofac,
                    cabecera.ccpfac,
                    cabecera.cprfac,
                    cabecera.telfac,
                    cabecera.ipor1fac,
                    cabecera.tivfac,
                    cabecera.iiva1fac,
                    cabecera.piva1fac,
                    cabecera.piva2fac,
                    cabecera.piva3fac,
                    cabecera.net1fac,
                    cabecera.totfac
                ]
            });
            const facturaId = pgHeaderResult.rows[0].codfac;
            for (const linea of lineas) {
                yield pool_1.default.query({
                    text: INSERT_LINE_PG,
                    values: [
                        linea.tiplfa,
                        facturaId,
                        linea.poslfa,
                        linea.artlfa,
                        linea.deslfa,
                        linea.canlfa,
                        linea.prelfa,
                        linea.totlfa
                    ]
                });
            }
            yield insertInvoiceIntoAccessDB(cabecera, lineas, facturaId);
            res.status(201).json({ message: 'Factura creada correctamente', facturaId });
        }
        catch (error) {
            console.error('Error al crear la factura:', error);
            res.status(500).json({ error: 'Error al crear la factura' });
        }
    });
}
/**
 * Actualiza el estado de una factura en PostgreSQL y Access.
 */
function updateFacturaEstado(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { codfac, nuevoEstado } = req.body;
        if (codfac === undefined || !nuevoEstado) {
            res.status(400).json({ error: 'Se requieren codfac y nuevoEstado' });
            return;
        }
        try {
            yield pool_1.default.query({
                text: 'UPDATE f_fac SET estfac = $1 WHERE codfac = $2',
                values: [nuevoEstado, codfac]
            });
            yield updateInvoiceStatusInAccessDB(codfac, nuevoEstado);
            res.status(200).json({ message: 'Estado de factura actualizado correctamente' });
        }
        catch (error) {
            console.error('Error al actualizar la factura:', error);
            res.status(500).json({ error: 'Error al actualizar la factura' });
        }
    });
}
/**
 * Crea una factura para un pedido existente. Recupera la cabecera y líneas
 * del pedido (en f_pcl y f_lpc), obtiene un nuevo ID, mapea los datos a la
 * estructura de la factura, inserta en PostgreSQL, sincroniza en Access, y
 * genera el PDF de la factura.
 */
function createInvoiceForOrder(pedidoId, shippingCost) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const orderHeaderResult = yield pool_1.default.query('SELECT * FROM f_pcl WHERE codpcl = $1', [pedidoId]);
            if (orderHeaderResult.rowCount === 0)
                return;
            const orderHeader = orderHeaderResult.rows[0];
            const orderLinesResult = yield pool_1.default.query('SELECT * FROM f_lpc WHERE codlpc = $1', [pedidoId]);
            const orderLines = orderLinesResult.rows;
            const facturaId = yield getNextInvoiceId();
            const dbShipping = Number(orderHeader.ipor1pcl) || 0;
            const invoiceShipping = dbShipping > 0 ? dbShipping : shippingCost;
            const invoiceCabecera = {
                tipfac: orderHeader.tippcl,
                codfac: facturaId,
                reffac: orderHeader.refpcl,
                fecfac: orderHeader.fecpcl,
                estfac: '2',
                almfac: orderHeader.almpcl,
                agefac: orderHeader.agepcl,
                clifac: orderHeader.clipcl,
                cnofac: orderHeader.cnopcl,
                cdofac: orderHeader.cdopcl,
                cpofac: orderHeader.cpopcl,
                ccpfac: orderHeader.ccppcl,
                cprfac: orderHeader.cprpcl,
                telfac: orderHeader.telpcl,
                tivfac: orderHeader.tivpcl,
                cemfac: orderHeader.cempcl,
                cpafac: orderHeader.cpapcl,
                ipor1fac: invoiceShipping,
                iiva1fac: orderHeader.iiva1pcl,
                piva1fac: 21,
                piva2fac: 10,
                piva3fac: 4,
                net1fac: orderHeader.net1pcl,
                totfac: orderHeader.totpcl
            };
            const invoiceLineas = orderLines.map((ln) => ({
                tiplfa: ln.tiplpc,
                codlfa: facturaId,
                poslfa: ln.poslpc,
                artlfa: ln.artlpc,
                deslfa: ln.deslpc,
                canlfa: ln.canlpc,
                prelfa: ln.prelpc,
                totlfa: ln.totlpc,
                vatType: ln.ivalpc,
                quantity: Number(ln.canlpc),
                unitPrice: Number(ln.prelpc),
                total: Number(ln.totlpc)
            }));
            yield pool_1.default.query({
                text: INSERT_HEADER_PG + " RETURNING codfac",
                values: [
                    invoiceCabecera.tipfac, invoiceCabecera.codfac, invoiceCabecera.reffac, invoiceCabecera.fecfac,
                    invoiceCabecera.estfac, invoiceCabecera.almfac, invoiceCabecera.agefac, invoiceCabecera.clifac,
                    invoiceCabecera.cnofac, invoiceCabecera.cdofac, invoiceCabecera.cpofac, invoiceCabecera.ccpfac,
                    invoiceCabecera.cprfac, invoiceCabecera.telfac, invoiceCabecera.ipor1fac, invoiceCabecera.tivfac,
                    invoiceCabecera.iiva1fac, invoiceCabecera.piva1fac, invoiceCabecera.piva2fac,
                    invoiceCabecera.piva3fac, invoiceCabecera.net1fac, invoiceCabecera.totfac
                ]
            });
            for (const linea of invoiceLineas) {
                yield pool_1.default.query({
                    text: INSERT_LINE_PG,
                    values: [
                        linea.tiplfa, facturaId, linea.poslfa,
                        linea.artlfa, linea.deslfa, linea.canlfa,
                        linea.prelfa, linea.totlfa
                    ]
                });
            }
            yield insertInvoiceIntoAccessDB(invoiceCabecera, invoiceLineas, facturaId);
            // Generación de PDF
            const hoy = new Date();
            const fecha = [
                String(hoy.getDate()).padStart(2, '0'),
                String(hoy.getMonth() + 1).padStart(2, '0'),
                hoy.getFullYear()
            ].join('-');
            const invoiceData = {
                invoiceId: invoiceCabecera.reffac,
                date: fecha,
                customerName: invoiceCabecera.cnofac,
                customerEmail: invoiceCabecera.cemfac,
                customerAddress: [invoiceCabecera.cdofac, invoiceCabecera.cpofac, invoiceCabecera.ccpfac, invoiceCabecera.cprfac]
                    .filter(Boolean).join(', ') || '—',
                companyName: (_a = config_json_1.default.company) === null || _a === void 0 ? void 0 : _a.name,
                companyLogoUrl: (_b = config_json_1.default.company) === null || _b === void 0 ? void 0 : _b.logoPath,
                companyAddress: (_c = config_json_1.default.company) === null || _c === void 0 ? void 0 : _c.address,
                shippingCost: invoiceShipping,
                tax21: invoiceLineas.filter(l => l.vatType === '0')
                    .reduce((sum, l) => sum + l.quantity * l.unitPrice * 0.21, 0),
                tax10: invoiceLineas.filter(l => l.vatType === '1')
                    .reduce((sum, l) => sum + l.quantity * l.unitPrice * 0.10, 0),
                tax4: invoiceLineas.filter(l => l.vatType === '2')
                    .reduce((sum, l) => sum + l.quantity * l.unitPrice * 0.04, 0),
                lines: invoiceLineas.map(l => ({
                    description: l.deslfa,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    total: l.total
                })),
                subTotal: invoiceLineas.reduce((s, l) => s + l.total, 0),
                total: invoiceLineas.reduce((s, l) => s + l.total, 0) + invoiceShipping
            };
            const pdfBuffer = yield (0, generateInvoicePDF_1.generateInvoicePDF)(invoiceData);
            fs.writeFileSync(`Factura_${invoiceCabecera.reffac}_${fecha}.pdf`, pdfBuffer);
            console.log(`PDF generado: Factura_${invoiceCabecera.reffac}_${fecha}.pdf`);
        }
        catch (error) {
            console.error('Error al crear la factura para el pedido:', error);
            throw error;
        }
    });
}
