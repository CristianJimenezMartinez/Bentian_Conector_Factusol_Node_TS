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
exports.createPedido = createPedido;
const pool_1 = __importDefault(require("./helpers/pool"));
const config_json_1 = __importDefault(require("../../config.json"));
const orderService_1 = require("../services/orderService");
const dbFilePath = config_json_1.default.file.path_file_factusol;
const sanitize = (str) => {
    return String(str).replace(/'/g, "''");
};
/**
 * Función para obtener el próximo ID de pedido (codpcl)
 * Consulta el valor máximo actual en la tabla f_pcl y retorna ese valor + 1.
 */
function getNextOrderId() {
    return __awaiter(this, void 0, void 0, function* () {
        let pgMax = 0;
        try {
            const pgResult = yield pool_1.default.query("SELECT COALESCE(MAX(codpcl), 0) AS maxid FROM f_pcl");
            pgMax = parseInt(pgResult.rows[0].maxid);
        }
        catch (error) {
            console.error("Error obteniendo el máximo ID en f_pcl:", error);
        }
        return pgMax + 1;
    });
}
function createPedido(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const cabecera = (_b = (_a = req.body.order) === null || _a === void 0 ? void 0 : _a.cabecera) !== null && _b !== void 0 ? _b : req.body.cabecera;
        const lineas = (_d = (_c = req.body.order) === null || _c === void 0 ? void 0 : _c.lineas) !== null && _d !== void 0 ? _d : req.body.lineas;
        if (!cabecera || !Array.isArray(lineas)) {
            return res.status(400).json({ error: 'Cabecera y líneas son requeridos' });
        }
        try {
            const pedidoId = yield (0, orderService_1.createPedidoEnBases)(cabecera, lineas);
            res.status(201).json({ message: 'Pedido creado', pedidoId });
        }
        catch (err) {
            console.error('createPedidoError:', err);
            res.status(500).json({ error: 'No se pudo crear el pedido' });
        }
    });
}
