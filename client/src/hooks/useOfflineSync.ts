import { useEffect } from "react";

import { getOfflineOperations, clearOfflineOperations } from "../services/offline/syncQueue";

import { socket } from "../services/socket/socketClient";

export const useOfflineSync = () => {

  useEffect(() => {

    const handleOnline = async () => {
      if (!navigator.onLine) return;
      const operations = await getOfflineOperations();
      if (!operations.length) return;
      socket.emit("sync:operations", operations);
      await clearOfflineOperations();
    };
    if (navigator.onLine) {
      handleOnline();
    }
    window.addEventListener("online", handleOnline);

    socket.on("connect", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
      socket.off("connect", handleOnline);
    };

  }, []);

};