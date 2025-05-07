"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const configFilePath = path_1.default.join(__dirname, '../../../config.json');
function getConfig(req, res) {
    fs_1.default.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer el archivo de configuración' });
        }
        res.json(JSON.parse(data));
    });
}
function updateConfig(req, res) {
    const newConfig = req.body;
    fs_1.default.writeFile(configFilePath, JSON.stringify(newConfig, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al escribir el archivo de configuración' });
        }
        res.json({ message: 'Configuración actualizada correctamente' });
    });
}
