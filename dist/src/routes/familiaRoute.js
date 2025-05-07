"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const familiaController_1 = require("../controllers/familiaController");
const router = express_1.default.Router();
// Define la ruta para obtener los artículos
router.get('/family', familiaController_1.getFamily);
router.get('/family/:id', familiaController_1.getArticlesByFamily);
exports.default = router;
