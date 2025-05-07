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
const node_cron_1 = __importDefault(require("node-cron"));
const pool_1 = __importDefault(require("./pool"));
// Programa un cron job para ejecutarse cada hora (puedes ajustar la frecuencia)
node_cron_1.default.schedule('0 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield pool_1.default.query(`
        DELETE FROM f_pcl
        WHERE estado = 'PENDIENTE'
          AND fecpcl < NOW() - INTERVAL '24 hours'
      `);
        const deletedCount = (_a = result.rowCount) !== null && _a !== void 0 ? _a : 0;
        if (deletedCount > 0) {
            console.log(`Se eliminaron ${deletedCount} pedidos pendientes de más de 24 horas.`);
        }
    }
    catch (err) {
        console.error('Error al eliminar pedidos pendientes:', err);
    }
}));
