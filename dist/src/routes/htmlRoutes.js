"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const html_1 = require("../views/html");
const router = express_1.default.Router();
const path = "src/routes/conf.txt";
// Define la ruta para obtener los artículos
router.get('/', (req, res) => {
    res.redirect('/panel/home');
});
router.get('/home', (req, res) => {
    const htmlContent = (0, html_1.generateHTMLHome)(); // Genera el contenido HTML
    res.send(htmlContent); // Envía el contenido HTML como respuesta
});
router.get('/configuracion', (req, res) => {
    console.log(path);
    const htmlContent = (0, html_1.formHTMLConfiguration)(path); // Genera el contenido HTML
    res.send(htmlContent); // Envía el contenido HTML como respuesta
});
exports.default = router;
