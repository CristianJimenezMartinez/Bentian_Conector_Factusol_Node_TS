import express from 'express';
import { getMeasures, getMeasureById } from '../controllers/medidasController';

const router = express.Router();

// Ruta para obtener todas las medidas
router.get('/measures', getMeasures);

// Ruta para obtener una medida por su ID (codume)
router.get('/measures/:id', getMeasureById);

export default router;
