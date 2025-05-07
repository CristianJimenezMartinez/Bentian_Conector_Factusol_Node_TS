import { Request, Response } from 'express';
import pool from './helpers/pool';

export async function getSecction(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT * FROM f_sec');
    // Filtrar solo las secciones activas (suwsec = '1')
    const filtered = result.rows.filter((sec: any) => sec.suwsec === '1');
    // Mapear a los campos necesarios, por ejemplo: codsec y dessec
    const mappedSections = filtered.map((sec: any) => ({
      codsec: sec.codsec,
      dessec: sec.dessec,
      imasec: sec.imasec
    }));
    res.json(mappedSections);
  } catch (error) {
    console.error('Error al obtener las secciones:', error);
    res.status(500).send('Error al obtener las secciones de la base de datos');
  }
}

export async function getFamiliesBySection(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    // Seleccionar familias activas de una sección
    const query = {
      text: 'SELECT * FROM f_fam WHERE codsec = $1 AND suwfam = $2',
      values: [id, '1']
    };
    const result = await pool.query(query);
    // Mapear cada familia a solo los campos necesarios: codfam y desfam
    const mappedFamilies = result.rows.map((family: any) => ({
      codfam: family.codfam,
      desfam: family.desfam
    }));
    res.json(mappedFamilies);
  } catch (error) {
    console.error('Error al obtener las familias de la sección:', error);
    res.status(500).json({ error: 'Error al obtener las familias de la sección de la base de datos' });
  }
}

export async function getFamiliesBySections(req: Request, res: Response): Promise<void> {
  // Se espera que el parámetro se llame "ids" y contenga una cadena separada por comas, por ejemplo: "1,2,3"
  const { ids } = req.params;
  try {
    // Convertir la cadena en un arreglo de IDs (como strings)
    const idArray = ids.split(',').map(id => id.trim());
    
    // Consulta usando el operador ANY de PostgreSQL para comparar un arreglo
    const queryText = `
      SELECT * FROM f_fam 
      WHERE secfam = ANY($1::text[]) 
      AND suwfam = $2

    `;
    const queryValues = [idArray, '1'];
    const result = await pool.query(queryText, queryValues);
    
    // Mapear cada familia a los campos necesarios (por ejemplo, codfam y desfam)
    const mappedFamilies = result.rows.map((family: any) => ({
      codfam: family.codfam,
      desfam: family.desfam
    }));
    res.json(mappedFamilies);
  } catch (error) {
    console.error('Error al obtener las familias por secciones:', error);
    res.status(500).json({ error: 'Error al obtener las familias por secciones de la base de datos' });
  }
}
