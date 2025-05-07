// src/controllers/helpers/orderId.ts
import pool from './pool';

export async function getNextOrderId(): Promise<number> {
  const { rows } = await pool.query(
    "SELECT COALESCE(MAX(codpcl),0) AS maxid FROM f_pcl"
  );
  return Number(rows[0].maxid) + 1;
}
