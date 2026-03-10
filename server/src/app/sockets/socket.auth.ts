import { Socket } from "socket.io";
import { verifyAccessToken } from "../common/utils/jwt.utils";

export const authenticateSocket = (socket: Socket) => {

  const token = socket.handshake.auth?.token;

  if (!token) {
    throw new Error("Unauthorized socket");
  }

  const decoded = verifyAccessToken(token) as { id: string };

  socket.data.userId = decoded.id;
};