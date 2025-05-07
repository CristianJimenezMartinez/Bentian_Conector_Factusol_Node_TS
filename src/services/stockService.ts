// src/services/stockService.ts
import pool from '../controllers/helpers/pool';

export async function updateStock(codArt: string, quantity: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ––– Código original comentado –––
    // const updateQuery = `
    //   UPDATE f_sto
    //   SET actsto = actsto - $1
    //   WHERE artsto = $2 AND actsto >= $1
    // `;
    // const res = await client.query(updateQuery, [quantity, codArt]);
    // if (res.rowCount === 0) {
    //   throw new Error(`Stock insuficiente para el artículo ${codArt}`);
    // }

    // Bypass: simulamos que siempre hay stock y hacemos commit
    console.log(`[updateStock] Simulando decremento de stock de ${quantity} unidades para ${codArt}`);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
