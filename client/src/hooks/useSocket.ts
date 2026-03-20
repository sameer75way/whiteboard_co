import { useEffect } from "react";

import { socket } from "../services/socket/socketClient";
import { setSocketId } from "../services/socket/socketState";

import { registerSocketHandlers } from "../services/socket/socketHandlers";

export const useSocket = (token: string) => {

  useEffect(() => {

    const connectSocket = () => {
      socket.auth = { token };
      if (!socket.connected) {
        socket.connect();
      }
    };

    const disconnectSocket = () => {
      setSocketId(null);
      if (socket.connected) {
        socket.disconnect();
      }
    };

    const handleConnect = () => {
      setSocketId(socket.id ?? null);
    };

    const handleDisconnect = () => {
      setSocketId(null);
    };

    const handlePageHide = () => {
      disconnectSocket();
    };

    const handlePageShow = () => {
      connectSocket();
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    connectSocket();

    const cleanupHandlers = registerSocketHandlers();

    return () => {
      cleanupHandlers();
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      disconnectSocket();
    };

  }, [token]);

};