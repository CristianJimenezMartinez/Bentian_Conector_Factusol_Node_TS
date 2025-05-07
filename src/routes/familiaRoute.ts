import express from 'express';
import { getFamily,getArticlesByFamily } from '../controllers/familiaController';

const router = express.Router();

// Define la ruta para obtener los artículos
router.get('/family', getFamily);
router.get('/family/:id', getArticlesByFamily);

export default router;