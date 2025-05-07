"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ratesController_1 = require("../controllers/ratesController");
const router = express_1.default.Router();
// Define la ruta para obtener los artículos
router.get('/rates', ratesController_1.getRates);
exports.default = router;
