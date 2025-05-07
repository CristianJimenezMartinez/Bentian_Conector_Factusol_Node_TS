// src/services/accessOrderService.ts
import ADODB from 'node-adodb';
import config from '../../config.json';
import { Pedido } from '../models/pedido';

const accessConnection = ADODB.open(
  `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${config.file.path_file_factusol};`
);

const sanitize = (str: string): string =>
  String(str ?? '').replace(/'/g, "''");

/**
 * Inserta un pedido en Access (tabla f_pcl y f_lpc)
 */
export async function insertOrderIntoAccess(order: Pedido, pedidoId: number): Promise<void> {
  const {
    tippcl,
    refpcl,
    fecpcl,
    agepcl,
    clipcl,
    tivpcl,
    reqpcl,
    almpcl,
    cnopcl,
    cdopcl,
    cpopcl,
    ccppcl,
    cprpcl,
    telpcl,
    net1pcl,
    iiva1pcl,
    totpcl
  } = order.cabecera;

  // Convertir valores, usando 0 por defecto si no son numéricos
  const _agepcl    = parseInt(agepcl as any, 10) || 0;
  const _clipcl    = parseInt(clipcl as any, 10) || 0;
  const _tivpcl    = parseInt(tivpcl as any, 10) || 0;
  const _reqpcl    = parseInt(reqpcl as any, 10) || 0;
  const _net1pcl   = Number(net1pcl) || 0;
  const _iiva1pcl  = Number(iiva1pcl) || 0;
  const _totpcl    = Number(totpcl) || 0;

  // Preparamos otros valores seguros
  const _tippcl    = `'${sanitize(tippcl)}'`;
  const _refpcl    = `'${sanitize(String(refpcl))}'`;
  const _fecpcl    = `#${sanitize(fecpcl as any)}#`;
  const _almpcl    = almpcl ? `'${sanitize(almpcl as any)}'` : 'NULL';
  const _cnopcl    = cnopcl ? `'${sanitize(cnopcl)}'` : 'NULL';
  const _cdopcl    = cdopcl ? `'${sanitize(cdopcl)}'` : 'NULL';
  const _cpopcl    = cpopcl ? `'${sanitize(cpopcl)}'` : 'NULL';
  const _ccppcl    = ccppcl ? `'${sanitize(ccppcl)}'` : 'NULL';
  const _cprpcl    = cprpcl ? `'${sanitize(cprpcl)}'` : 'NULL';
  const _telpcl    = telpcl ? `'${sanitize(telpcl)}'` : 'NULL';
  const _cempcl   = order.cabecera.cempcl ? `'${sanitize(order.cabecera.cempcl)}'` : 'NULL';
  const _cpapcl   = order.cabecera.cpapcl ? `'${sanitize(order.cabecera.cpapcl)}'` : 'NULL';

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
  await accessConnection.execute(cabeceraSQL);

  // Inserción de las líneas
  for (const linea of order.lineas) {
    const {
      tiplpc,
      poslpc,
      artlpc,
      deslpc,
      canlpc,
      dt1lpc,
      prelpc,
      totlpc
    } = linea;

    const _tiplpc = `'${sanitize(tiplpc)}'`;
    const _poslpc = parseInt(poslpc as any, 10) || 0;
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
    await accessConnection.execute(lineaSQL);
  }
}
