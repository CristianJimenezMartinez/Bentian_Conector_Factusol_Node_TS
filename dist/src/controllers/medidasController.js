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
exports.getMeasures = getMeasures;
exports.getMeasureById = getMeasureById;
const pool_1 = __importDefault(require("./helpers/pool"));
/**
 * Obtiene todas las medidas de la tabla f_ume.
 * Se mapean los campos relevantes (por ejemplo, código y descripción de la medida).
 */
function getMeasures(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Consultar todas las medidas de la tabla f_ume
            const umeResult = yield pool_1.default.query('SELECT * FROM f_ume');
            // Mapear cada registro a un objeto con los campos requeridos
            const measures = umeResult.rows.map((ume) => ({
                codume: ume.codume, // Código de medida
                desume: ume.desume // Descripción de la medida
                // Puedes agregar más campos si la tabla los tiene, por ejemplo:
                // otroCampo: ume.otroCampo,
            }));
            res.json({ measures });
        }
        catch (error) {
            console.error('Error al obtener las medidas:', error);
            res.status(500).send('Error al obtener los datos de la base de datos');
        }
    });
}
/**
 * Obtiene una medida específica a partir de su código (codume).
 */
function getMeasureById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const query = {
                text: 'SELECT * FROM f_ume WHERE codume = $1',
                values: [id]
            };
            const result = yield pool_1.default.query(query);
            if (result.rows.length === 1) {
                const measure = {
                    codume: result.rows[0].codume,
                    desume: result.rows[0].desume
                    // Agrega otros campos si es necesario
                };
                res.json(measure);
            }
            else {
                res.status(404).json({ error: 'Medida no encontrada' });
            }
        }
        catch (error) {
            console.error('Error al obtener la medida:', error);
            res.status(500).json({ error: 'Error al obtener la medida' });
        }
    });
}
