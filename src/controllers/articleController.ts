import { Request, Response } from 'express';
import pool from './helpers/pool';

export interface Article {
  codart: string;
  desart: string;
  dewart?: string;
  pcoart: string;
  imgart: string;
  famart: string;
  eanart: string;
}

export async function getArticles(req: Request, res: Response): Promise<void> {
  try {
    // Consulta optimizada para artículos activos y solo los campos requeridos
    const artQuery = `
      SELECT codart, eanart, famart, desart, dewart, tivart,
             cp1art, cp2art, cp3art, imgart, mewart, cstart,
             pcoart, uumart
      FROM f_art
      WHERE suwart = '1'
    `;
    const artResult = await pool.query(artQuery);

    // Consulta optimizada para medidas (solo registros no vacíos)
    const umeQuery = `
      SELECT desume
      FROM f_ume
      WHERE TRIM(desume) <> ''
    `;
    const umeResult = await pool.query(umeQuery);

    // Mapeamos las medidas extrayendo la columna 'desume'
    const measures = umeResult.rows.map((row: any) => row.desume);

    res.json({ articles: artResult.rows, measures });
  } catch (error) {
    console.error('Error al obtener los artículos o las medidas:', error);
    res.status(500).send('Error al obtener los datos de la base de datos');
  }
}

export async function getIdArticles(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const query = {
      text: `
        SELECT codart, eanart, famart, desart, dewart, tivart,
               cp1art, cp2art, cp3art, imgart, mewart, cstart,
               pcoart, uumart
        FROM f_art
        WHERE codart = $1 AND suwart = '1'
      `,
      values: [id]
    };
    const result = await pool.query(query);
    if (result.rows.length === 1) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Artículo no encontrado o no activo' });
    }
  } catch (error) {
    console.error('Error al obtener el artículo:', error);
    res.status(500).json({ error: 'Error al obtener el artículo' });
  }
}
export async function searchArticles(params: { query: string }): Promise<Article[]> {
  const { query } = params;
  if (!query || !query.trim()) {
    throw new Error('Missing query parameter');
  }

  // Usamos ILIKE para que la búsqueda sea insensible a mayúsculas/minúsculas
  const sql = `
    SELECT codart, desart, dewart, pcoart, imgart, famart, eanart
    FROM f_art
    WHERE desart ILIKE $1
       OR dewart ILIKE $1
  `;
  const values = [`%${query.trim()}%`];

  try {
    const result = await pool.query(sql, values);
    return result.rows as Article[];
  } catch (error) {
    console.error('Error in searchArticles:', error);
    throw new Error('Internal Server Error');
  }
}

