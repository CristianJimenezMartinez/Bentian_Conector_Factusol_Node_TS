"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
exports.initializeSocket = initializeSocket;
// src/socket.ts
const socket_io_1 = require("socket.io");
const config_json_1 = __importDefault(require("../config.json"));
let io = null;
exports.io = io;
/**
 * Inicializa la instancia de Socket.IO utilizando un servidor HTTP.
 * Configura, por ejemplo, las opciones de CORS y eventos básicos.
 * @param server - Servidor HTTP en el que se inicializa el Socket.IO.
 */
function initializeSocket(server) {
    exports.io = io = new socket_io_1.Server(server, {
        cors: config_json_1.default.cors
    });
    io.on('connection', (socket) => {
        console.log(`Nuevo cliente conectado: ${socket.id}`);
        // Permite que el cliente se suscriba a una sala o canal si es necesario.
        socket.on('joinRoom', (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} se unió a la sala ${room}`);
        });
        // Cuando el cliente se desconecta
        socket.on('disconnect', () => {
            console.log(`Socket ${socket.id} desconectado.`);
        });
    });
    console.log("Socket.IO inicializado correctamente.");
}
