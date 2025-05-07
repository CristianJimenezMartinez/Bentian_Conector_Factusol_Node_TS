"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const medidasController_1 = require("../controllers/medidasController");
const router = express_1.default.Router();
// Ruta para obtener todas las medidas
router.get('/measures', medidasController_1.getMeasures);
// Ruta para obtener una medida por su ID (codume)
router.get('/measures/:id', medidasController_1.getMeasureById);
exports.default = router;
