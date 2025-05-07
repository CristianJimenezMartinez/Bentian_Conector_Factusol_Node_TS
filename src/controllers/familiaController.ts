import { Request, Response } from 'express';
import pool from './helpers/pool';

export async function getFamily(req: Request, res: Response): Promise<void> {
  try {
    // Consulta optimizada: selecciona solo los campos necesarios y filtra en SQL
    const queryText = 'SELECT codfam, desfam FROM f_fam WHERE suwfam = $1';
    const values = ['1'];
    const result = await pool.query(queryText, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener las familias:', error);
    res.status(500).send('Error al obtener las familias de la base de datos');
  }
}

export async function getArticlesByFamily(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    // Consulta optimizada: se seleccionan solo los campos necesarios y se filtra en SQL
    const query = {
      text: `SELECT codart, desart, pcoart, imgart, famart, eanart 
             FROM f_art 
             WHERE famart = $1 
               AND suwart = '1'
               AND EXISTS (
                 SELECT 1 FROM f_fam WHERE codfam = $1 AND suwfam = '1'
               )`,
      values: [id]
    };
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los artículos de la familia:', error);
    res.status(500).json({ error: 'Error al obtener los artículos de la familia de la base de datos' });
  }
}
