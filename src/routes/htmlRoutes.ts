import express from 'express';
import { generateHTMLHome, generateHTMLConfiguration, formHTMLConfiguration, buttonLogic} from '../views/html';


const router = express.Router();
const path = "src/routes/conf.txt";
// Define la ruta para obtener los artículos
router.get('/', (req, res) => {
    res.redirect('/panel/home');
  });
router.get('/home', (req, res) => {
    const htmlContent = generateHTMLHome(); // Genera el contenido HTML
    res.send(htmlContent); // Envía el contenido HTML como respuesta
  });
router.get('/configuracion', (req, res) => {
  console.log(path);
    const htmlContent = formHTMLConfiguration(path); // Genera el contenido HTML
    res.send(htmlContent); // Envía el contenido HTML como respuesta
  });

export default router;