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
exports.getNextOrderId = getNextOrderId;
// src/controllers/helpers/orderId.ts
const pool_1 = __importDefault(require("./pool"));
function getNextOrderId() {
    return __awaiter(this, void 0, void 0, function* () {
        const { rows } = yield pool_1.default.query("SELECT COALESCE(MAX(codpcl),0) AS maxid FROM f_pcl");
        return Number(rows[0].maxid) + 1;
    });
}
