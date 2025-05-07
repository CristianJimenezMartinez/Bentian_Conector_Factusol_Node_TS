import { Request, Response } from 'express';
import pool from './helpers/pool';

export async function getRates(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT * FROM f_tar');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ error: 'Error fetching rates' });
  }
}
