import { Server } from "socket.io";
import http from "http";

import { authenticateSocket } from "./socket.auth";
import { registerSocketHandlers } from "./socket.handlers";

let io: Server;

export const initSocketServer = (server: http.Server) => {

  io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.use((socket, next) => {

    try {

      authenticateSocket(socket);

      next();

    } catch (error) {

      next(new Error("Socket authentication failed"));

    }

  });

  io.on("connection", (socket) => {

    registerSocketHandlers(io, socket);

  });

};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};