import { Request, Response } from 'express';
import pool from './helpers/pool';

/**
 * Obtiene todas las medidas de la tabla f_ume.
 * Se mapean los campos relevantes (por ejemplo, código y descripción de la medida).
 */
export async function getMeasures(req: Request, res: Response): Promise<void> {
  try {
    // Consultar todas las medidas de la tabla f_ume
    const umeResult = await pool.query('SELECT * FROM f_ume');
    // Mapear cada registro a un objeto con los campos requeridos
    const measures = umeResult.rows.map((ume: any) => ({
      codume: ume.codume,  // Código de medida
      desume: ume.desume   // Descripción de la medida
      // Puedes agregar más campos si la tabla los tiene, por ejemplo:
      // otroCampo: ume.otroCampo,
    }));

    res.json({ measures });
  } catch (error) {
    console.error('Error al obtener las medidas:', error);
    res.status(500).send('Error al obtener los datos de la base de datos');
  }
}

/**
 * Obtiene una medida específica a partir de su código (codume).
 */
export async function getMeasureById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const query = {
      text: 'SELECT * FROM f_ume WHERE codume = $1',
      values: [id]
    };
    const result = await pool.query(query);
    if (result.rows.length === 1) {
      const measure = {
        codume: result.rows[0].codume,
        desume: result.rows[0].desume
        // Agrega otros campos si es necesario
      };
      res.json(measure);
    } else {
      res.status(404).json({ error: 'Medida no encontrada' });
    }
  } catch (error) {
    console.error('Error al obtener la medida:', error);
    res.status(500).json({ error: 'Error al obtener la medida' });
  }
}
