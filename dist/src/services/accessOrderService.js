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
exports.insertOrderIntoAccess = insertOrderIntoAccess;
// src/services/accessOrderService.ts
const node_adodb_1 = __importDefault(require("node-adodb"));
const config_json_1 = __importDefault(require("../../config.json"));
const accessConnection = node_adodb_1.default.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${config_json_1.default.file.path_file_factusol};`);
const sanitize = (str) => String(str !== null && str !== void 0 ? str : '').replace(/'/g, "''");
/**
 * Inserta un pedido en Access (tabla f_pcl y f_lpc)
 */
function insertOrderIntoAccess(order, pedidoId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { tippcl, refpcl, fecpcl, agepcl, clipcl, tivpcl, reqpcl, almpcl, cnopcl, cdopcl, cpopcl, ccppcl, cprpcl, telpcl, net1pcl, iiva1pcl, totpcl } = order.cabecera;
        // Convertir valores, usando 0 por defecto si no son numéricos
        const _agepcl = parseInt(agepcl, 10) || 0;
        const _clipcl = parseInt(clipcl, 10) || 0;
        const _tivpcl = parseInt(tivpcl, 10) || 0;
        const _reqpcl = parseInt(reqpcl, 10) || 0;
        const _net1pcl = Number(net1pcl) || 0;
        const _iiva1pcl = Number(iiva1pcl) || 0;
        const _totpcl = Number(totpcl) || 0;
        // Preparamos otros valores seguros
        const _tippcl = `'${sanitize(tippcl)}'`;
        const _refpcl = `'${sanitize(String(refpcl))}'`;
        const _fecpcl = `#${sanitize(fecpcl)}#`;
        const _almpcl = almpcl ? `'${sanitize(almpcl)}'` : 'NULL';
        const _cnopcl = cnopcl ? `'${sanitize(cnopcl)}'` : 'NULL';
        const _cdopcl = cdopcl ? `'${sanitize(cdopcl)}'` : 'NULL';
        const _cpopcl = cpopcl ? `'${sanitize(cpopcl)}'` : 'NULL';
        const _ccppcl = ccppcl ? `'${sanitize(ccppcl)}'` : 'NULL';
        const _cprpcl = cprpcl ? `'${sanitize(cprpcl)}'` : 'NULL';
        const _telpcl = telpcl ? `'${sanitize(telpcl)}'` : 'NULL';
        const _cempcl = order.cabecera.cempcl ? `'${sanitize(order.cabecera.cempcl)}'` : 'NULL';
        const _cpapcl = order.cabecera.cpapcl ? `'${sanitize(order.cabecera.cpapcl)}'` : 'NULL';
        // SQL de cabecera con todos los campos
        const cabeceraSQL = `
    INSERT INTO f_pcl (
      tippcl, codpcl, refpcl, fecpcl, agepcl, clipcl, cempcl, cpapcl, tivpcl, reqpcl, almpcl,
      cnopcl, cdopcl, cpopcl, ccppcl, cprpcl, telpcl,
      net1pcl, iiva1pcl, totpcl
    ) VALUES (
      ${_tippcl},
       ${pedidoId},
      ${_refpcl},
      ${_fecpcl},
      ${_agepcl},
      ${_clipcl},
      ${_cempcl},
      ${_cpapcl},
      ${_tivpcl},
      ${_reqpcl},
      ${_almpcl},
      ${_cnopcl},
      ${_cdopcl},
      ${_cpopcl},
      ${_ccppcl},
      ${_cprpcl},
      ${_telpcl},
      ${_net1pcl},
      ${_iiva1pcl},
      ${_totpcl}
    )
  `;
        console.log('[accessOrderService] Ejecutando SQL de cabecera:', cabeceraSQL.trim());
        yield accessConnection.execute(cabeceraSQL);
        // Inserción de las líneas
        for (const linea of order.lineas) {
            const { tiplpc, poslpc, artlpc, deslpc, canlpc, dt1lpc, prelpc, totlpc } = linea;
            const _tiplpc = `'${sanitize(tiplpc)}'`;
            const _poslpc = parseInt(poslpc, 10) || 0;
            const _artlpc = `'${sanitize(artlpc)}'`;
            const _deslpc = `'${sanitize(deslpc)}'`;
            const _canlpc = Number(canlpc) || 0;
            const _dt1lpc = Number(dt1lpc) || 0;
            const _prelpc = Number(prelpc) || 0;
            const _totlpc = Number(totlpc) || 0;
            const lineaSQL = `
      INSERT INTO f_lpc (
        tiplpc, codlpc, poslpc, artlpc, deslpc, canlpc, dt1lpc, prelpc, totlpc
      ) VALUES (
        ${_tiplpc},
         ${pedidoId},
         ${_poslpc},
        ${_artlpc},
        ${_deslpc},
         ${_canlpc},
         ${_dt1lpc},
         ${_prelpc},
         ${_totlpc}
      )
    `;
            console.log('[accessOrderService] Ejecutando SQL de línea:', lineaSQL.trim());
            yield accessConnection.execute(lineaSQL);
        }
    });
}
