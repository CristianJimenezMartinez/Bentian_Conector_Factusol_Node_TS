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
exports.getArticles = getArticles;
exports.getIdArticles = getIdArticles;
exports.searchArticles = searchArticles;
const pool_1 = __importDefault(require("./helpers/pool"));
function getArticles(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Consulta optimizada para artículos activos y solo los campos requeridos
            const artQuery = `
      SELECT codart, eanart, famart, desart, dewart, tivart,
             cp1art, cp2art, cp3art, imgart, mewart, cstart,
             pcoart, uumart
      FROM f_art
      WHERE suwart = '1'
    `;
            const artResult = yield pool_1.default.query(artQuery);
            // Consulta optimizada para medidas (solo registros no vacíos)
            const umeQuery = `
      SELECT desume
      FROM f_ume
      WHERE TRIM(desume) <> ''
    `;
            const umeResult = yield pool_1.default.query(umeQuery);
            // Mapeamos las medidas extrayendo la columna 'desume'
            const measures = umeResult.rows.map((row) => row.desume);
            res.json({ articles: artResult.rows, measures });
        }
        catch (error) {
            console.error('Error al obtener los artículos o las medidas:', error);
            res.status(500).send('Error al obtener los datos de la base de datos');
        }
    });
}
function getIdArticles(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const query = {
                text: `
        SELECT codart, eanart, famart, desart, dewart, tivart,
               cp1art, cp2art, cp3art, imgart, mewart, cstart,
               pcoart, uumart
        FROM f_art
        WHERE codart = $1 AND suwart = '1'
      `,
                values: [id]
            };
            const result = yield pool_1.default.query(query);
            if (result.rows.length === 1) {
                res.json(result.rows[0]);
            }
            else {
                res.status(404).json({ error: 'Artículo no encontrado o no activo' });
            }
        }
        catch (error) {
            console.error('Error al obtener el artículo:', error);
            res.status(500).json({ error: 'Error al obtener el artículo' });
        }
    });
}
function searchArticles(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { query } = params;
        if (!query || !query.trim()) {
            throw new Error('Missing query parameter');
        }
        // Usamos ILIKE para que la búsqueda sea insensible a mayúsculas/minúsculas
        const sql = `
    SELECT codart, desart, dewart, pcoart, imgart, famart, eanart
    FROM f_art
    WHERE desart ILIKE $1
       OR dewart ILIKE $1
  `;
        const values = [`%${query.trim()}%`];
        try {
            const result = yield pool_1.default.query(sql, values);
            return result.rows;
        }
        catch (error) {
            console.error('Error in searchArticles:', error);
            throw new Error('Internal Server Error');
        }
    });
}
