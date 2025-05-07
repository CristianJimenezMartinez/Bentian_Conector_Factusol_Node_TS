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
exports.updateStock = updateStock;
// src/services/stockService.ts
const pool_1 = __importDefault(require("../controllers/helpers/pool"));
function updateStock(codArt, quantity) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield pool_1.default.connect();
        try {
            yield client.query('BEGIN');
            // ––– Código original comentado –––
            // const updateQuery = `
            //   UPDATE f_sto
            //   SET actsto = actsto - $1
            //   WHERE artsto = $2 AND actsto >= $1
            // `;
            // const res = await client.query(updateQuery, [quantity, codArt]);
            // if (res.rowCount === 0) {
            //   throw new Error(`Stock insuficiente para el artículo ${codArt}`);
            // }
            // Bypass: simulamos que siempre hay stock y hacemos commit
            console.log(`[updateStock] Simulando decremento de stock de ${quantity} unidades para ${codArt}`);
            yield client.query('COMMIT');
        }
        catch (err) {
            yield client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    });
}
