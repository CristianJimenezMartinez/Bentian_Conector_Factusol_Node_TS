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
exports.getSecction = getSecction;
exports.getFamiliesBySection = getFamiliesBySection;
exports.getFamiliesBySections = getFamiliesBySections;
const pool_1 = __importDefault(require("./helpers/pool"));
function getSecction(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield pool_1.default.query('SELECT * FROM f_sec');
            // Filtrar solo las secciones activas (suwsec = '1')
            const filtered = result.rows.filter((sec) => sec.suwsec === '1');
            // Mapear a los campos necesarios, por ejemplo: codsec y dessec
            const mappedSections = filtered.map((sec) => ({
                codsec: sec.codsec,
                dessec: sec.dessec,
                imasec: sec.imasec
            }));
            res.json(mappedSections);
        }
        catch (error) {
            console.error('Error al obtener las secciones:', error);
            res.status(500).send('Error al obtener las secciones de la base de datos');
        }
    });
}
function getFamiliesBySection(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            // Seleccionar familias activas de una sección
            const query = {
                text: 'SELECT * FROM f_fam WHERE codsec = $1 AND suwfam = $2',
                values: [id, '1']
            };
            const result = yield pool_1.default.query(query);
            // Mapear cada familia a solo los campos necesarios: codfam y desfam
            const mappedFamilies = result.rows.map((family) => ({
                codfam: family.codfam,
                desfam: family.desfam
            }));
            res.json(mappedFamilies);
        }
        catch (error) {
            console.error('Error al obtener las familias de la sección:', error);
            res.status(500).json({ error: 'Error al obtener las familias de la sección de la base de datos' });
        }
    });
}
function getFamiliesBySections(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Se espera que el parámetro se llame "ids" y contenga una cadena separada por comas, por ejemplo: "1,2,3"
        const { ids } = req.params;
        try {
            // Convertir la cadena en un arreglo de IDs (como strings)
            const idArray = ids.split(',').map(id => id.trim());
            // Consulta usando el operador ANY de PostgreSQL para comparar un arreglo
            const queryText = `
      SELECT * FROM f_fam 
      WHERE secfam = ANY($1::text[]) 
      AND suwfam = $2

    `;
            const queryValues = [idArray, '1'];
            const result = yield pool_1.default.query(queryText, queryValues);
            // Mapear cada familia a los campos necesarios (por ejemplo, codfam y desfam)
            const mappedFamilies = result.rows.map((family) => ({
                codfam: family.codfam,
                desfam: family.desfam
            }));
            res.json(mappedFamilies);
        }
        catch (error) {
            console.error('Error al obtener las familias por secciones:', error);
            res.status(500).json({ error: 'Error al obtener las familias por secciones de la base de datos' });
        }
    });
}
