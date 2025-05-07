// src/services/orderService.ts
import pool from '../controllers/helpers/pool';
import { insertOrderIntoAccess } from './accessOrderService';
import { Pedido } from '../models/pedido';

/**
 * Obtiene el próximo ID de pedido (codpcl) de la tabla f_pcl en PostgreSQL
 */
async function getNextOrderId(): Promise<number> {
  const result = await pool.query(`
    SELECT COALESCE(MAX(codpcl), 0) AS maxid
    FROM f_pcl
  `);
  const maxid = parseInt(result.rows[0].maxid, 10);
  return maxid + 1;
}

/**
 * Inserta un pedido en PostgreSQL y en Access de forma idempotente.
 * @param cabecera Datos de la cabecera del pedido
 * @param lineas  Array de líneas de detalle
 * @returns El codpcl (pedidoId) existente o recién generado
 */
export async function createPedidoEnBases(cabecera: any, lineas: any[]): Promise<number> {
  const ref = String(cabecera.refpcl).substring(0, 12);

  // 1) Comprobar si ya existe un pedido con esta referencia externa
  const existRes = await pool.query(
    'SELECT codpcl FROM f_pcl WHERE refpcl = $1',
    [ref]
  );

  // Validar que existRes no es null y comprobar rowCount
  if ((existRes.rowCount ?? 0) > 0) {
    const existingId = parseInt(existRes.rows[0].codpcl, 10);
    console.log(`[OrderService] Pedido ya existe refpcl=${ref}, codpcl=${existingId}`);
    return existingId;
  }

  // 2) Generar nuevo ID único
  const pedidoId = await getNextOrderId();

  // 3) Insertar la cabecera en PostgreSQL
  await pool.query(
    `INSERT INTO f_pcl (
       tippcl, codpcl, refpcl, fecpcl,
       agepcl, clipcl,
       cempcl, cpapcl,
       cnopcl, cdopcl, cpopcl, ccppcl, cprpcl, telpcl,
       tivpcl, almpcl,
       net1pcl, piva1pcl, piva2pcl, piva3pcl, iiva1pcl, totpcl,
       ppor1pcl, ipor1pcl
     ) VALUES (
       $1,      $2,      $3,      $4,
       $5,      $6,
       $7,      $8,
       $9,      $10,     $11,     $12,     $13,     $14,
       $15,     $16,
       $17,     $18,     $19,     $20,     $21,     $22,
       $23,     $24
     )`,
    [
      cabecera.tippcl,
      pedidoId,
      ref,
      cabecera.fecpcl,
      cabecera.agepcl   || null,
      cabecera.clipcl   || null,
      cabecera.cempcl   || null,
      cabecera.cpapcl   || null,
      cabecera.cnopcl   || null,
      cabecera.cdopcl   || null,
      cabecera.cpopcl   || null,
      cabecera.ccppcl   || null,
      cabecera.cprpcl   || null,
      cabecera.telpcl   || null,
      parseInt(cabecera.tivpcl as any, 10)  || 0,
      cabecera.almpcl   || null,
      parseFloat(cabecera.net1pcl as any) || 0,
      21,
      10,
      4,
      parseFloat(cabecera.iiva1pcl as any) || 0,
      parseFloat(cabecera.totpcl as any)  || 0,
      parseFloat(cabecera.ppor1pcl as any) || 0,
      parseFloat(cabecera.ipor1pcl as any) || 0
    ]
  );

  // 4) Insertar líneas en PostgreSQL
  for (const ln of lineas) {
    await pool.query(
      `INSERT INTO f_lpc (
         tiplpc, codlpc, poslpc, artlpc, deslpc, canlpc, dt1lpc, prelpc, totlpc, ivalpc
       ) VALUES (
         $1,      $2,      $3,      $4,      $5,      $6,      $7,       $8,      $9,   $10)`,
      [
        ln.tiplpc,
        pedidoId,
        ln.poslpc,
        ln.artlpc,
        ln.deslpc,
        ln.canlpc,
        ln.dt1lpc   || null,
        ln.prelpc,
        ln.totlpc,
        parseInt(ln.vatType as any, 10) || 0
      ]
    );
  }

  // 5) Sincronizar con Access
  const pedido: Pedido = { cabecera, lineas };
  await insertOrderIntoAccess(pedido, pedidoId);

  return pedidoId;
}