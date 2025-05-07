"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const articleController_1 = require("../controllers/articleController");
const router = express_1.default.Router();
// Define la ruta para obtener los artículos
router.get('/articles', articleController_1.getArticles);
router.get('/articles/search', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extraer el parámetro de la query string
        const query = req.query.query;
        const articles = yield (0, articleController_1.searchArticles)({ query });
        res.json(articles);
    }
    catch (error) {
        next(error);
    }
}));
router.get('/articles/:id', articleController_1.getIdArticles);
exports.default = router;
