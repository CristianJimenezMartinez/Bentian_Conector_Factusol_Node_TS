import express from 'express';
import { getRates } from '../controllers/ratesController';

const router = express.Router();

// Define la ruta para obtener los artículos
router.get('/rates', getRates);


export default router;