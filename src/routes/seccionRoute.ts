import express from 'express';
import { getSecction, getFamiliesBySection, getFamiliesBySections } from '../controllers/seccionController';

const router = express.Router();

// Define la ruta para obtener los artículos
router.get('/section', getSecction);
router.get('/section/:id', getFamiliesBySection);
router.get('/families/:ids', getFamiliesBySections);

export default router;