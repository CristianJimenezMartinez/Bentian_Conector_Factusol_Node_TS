import { Request, Response } from 'express';
import pool from './helpers/pool';
import { open } from 'node-adodb';
import config from '../../config.json';
import { createPedidoEnBases } from '../services/orderService';

const dbFilePath = config.file.path_file_factusol;

const sanitize = (str: string): string => {
  return String(str).replace(/'/g, "''");
};

/**
 * Función para obtener el próximo ID de pedido (codpcl)
 * Consulta el valor máximo actual en la tabla f_pcl y retorna ese valor + 1.
 */
async function getNextOrderId(): Promise<number> {
  let pgMax = 0;
  try {
    const pgResult = await pool.query("SELECT COALESCE(MAX(codpcl), 0) AS maxid FROM f_pcl");
    pgMax = parseInt(pgResult.rows[0].maxid);
  } catch (error) {
    console.error("Error obteniendo el máximo ID en f_pcl:", error);
  }
  return pgMax + 1;
}

export async function createPedido(req: Request, res: Response): Promise<any> {
  const cabecera = req.body.order?.cabecera ?? req.body.cabecera;
  const lineas   = req.body.order?.lineas   ?? req.body.lineas;
  if (!cabecera || !Array.isArray(lineas)) {
    return res.status(400).json({ error: 'Cabecera y líneas son requeridos' });
  }

  try {
    const pedidoId = await createPedidoEnBases(cabecera, lineas);
    res.status(201).json({ message: 'Pedido creado', pedidoId });
  } catch (err) {
    console.error('createPedidoError:', err);
    res.status(500).json({ error: 'No se pudo crear el pedido' });
  }
}

