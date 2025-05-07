"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const seccionController_1 = require("../controllers/seccionController");
const router = express_1.default.Router();
// Define la ruta para obtener los artículos
router.get('/section', seccionController_1.getSecction);
router.get('/section/:id', seccionController_1.getFamiliesBySection);
router.get('/families/:ids', seccionController_1.getFamiliesBySections);
exports.default = router;
