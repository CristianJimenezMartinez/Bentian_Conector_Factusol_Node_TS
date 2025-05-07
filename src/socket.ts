// src/socket.ts
import { Server } from 'socket.io';
import config from '../config.json';
import http from 'http';

let io: Server | null = null;

/**
 * Inicializa la instancia de Socket.IO utilizando un servidor HTTP.
 * Configura, por ejemplo, las opciones de CORS y eventos básicos.
 * @param server - Servidor HTTP en el que se inicializa el Socket.IO.
 */
export function initializeSocket(server: http.Server): void {
  io = new Server(server, {
    cors: config.cors
  });

  io.on('connection', (socket) => {
    console.log(`Nuevo cliente conectado: ${socket.id}`);

    // Permite que el cliente se suscriba a una sala o canal si es necesario.
    socket.on('joinRoom', (room: string) => {
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

/**
 * Devuelve la instancia de Socket.IO.
 * IMPORTANTE: Asegúrate de llamar a initializeSocket() antes de usar esta variable.
 */
export { io };
