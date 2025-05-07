import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const configFilePath = path.join(__dirname, '../../../config.json');

export function getConfig(req: Request, res: Response) {
  fs.readFile(configFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error al leer el archivo de configuración' });
    }
    res.json(JSON.parse(data));
  });
}

export function updateConfig(req: Request, res: Response) {
  const newConfig = req.body;
  fs.writeFile(configFilePath, JSON.stringify(newConfig, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al escribir el archivo de configuración' });
    }
    res.json({ message: 'Configuración actualizada correctamente' });
  });
}