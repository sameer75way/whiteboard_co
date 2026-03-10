import { useEffect } from "react";

import { socket } from "../services/socket/socketClient";

import { registerSocketHandlers } from "../services/socket/socketHandlers";

export const useSocket = (token: string) => {

  useEffect(() => {

    socket.auth = { token };
    socket.connect();

    const cleanupHandlers = registerSocketHandlers();

    return () => {
      cleanupHandlers();
      socket.disconnect();
    };

  }, [token]);

};