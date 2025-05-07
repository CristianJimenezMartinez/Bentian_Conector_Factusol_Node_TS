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
exports.getFamily = getFamily;
exports.getArticlesByFamily = getArticlesByFamily;
const pool_1 = __importDefault(require("./helpers/pool"));
function getFamily(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Consulta optimizada: selecciona solo los campos necesarios y filtra en SQL
            const queryText = 'SELECT codfam, desfam FROM f_fam WHERE suwfam = $1';
            const values = ['1'];
            const result = yield pool_1.default.query(queryText, values);
            res.json(result.rows);
        }
        catch (error) {
            console.error('Error al obtener las familias:', error);
            res.status(500).send('Error al obtener las familias de la base de datos');
        }
    });
}
function getArticlesByFamily(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            // Consulta optimizada: se seleccionan solo los campos necesarios y se filtra en SQL
            const query = {
                text: `SELECT codart, desart, pcoart, imgart, famart, eanart 
             FROM f_art 
             WHERE famart = $1 
               AND suwart = '1'
               AND EXISTS (
                 SELECT 1 FROM f_fam WHERE codfam = $1 AND suwfam = '1'
               )`,
                values: [id]
            };
            const result = yield pool_1.default.query(query);
            res.json(result.rows);
        }
        catch (error) {
            console.error('Error al obtener los artículos de la familia:', error);
            res.status(500).json({ error: 'Error al obtener los artículos de la familia de la base de datos' });
        }
    });
}
