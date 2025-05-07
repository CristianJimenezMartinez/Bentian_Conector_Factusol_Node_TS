import express from 'express';
import { getArticles, getIdArticles, searchArticles } from '../controllers/articleController';

const router = express.Router();

// Define la ruta para obtener los artículos
router.get('/articles', getArticles);
router.get('/articles/search', async (req, res, next) => {
    try {
        // Extraer el parámetro de la query string
        const query = req.query.query as string;
        const articles = await searchArticles({ query });
        res.json(articles);
    } catch (error) {
        next(error);
    }
});
router.get('/articles/:id', getIdArticles);

export default router;