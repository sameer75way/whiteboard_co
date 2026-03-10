import { useEffect, useState } from "react";
import { socket } from "../../../services/socket/socketClient";
import type { User } from "../../../store/auth/authSlice";

export const useWhiteboardSocket = (boardId: string | undefined, currentUser: User | null | undefined) => {
  const [isDeletedDialogOpen, setIsDeletedDialogOpen] = useState(false);
  const [isRemovedDialogOpen, setIsRemovedDialogOpen] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    
    const joinRoom = () => {
      socket.emit("board:join", { boardId });
    };

    joinRoom();

    const handleBoardDeleted = () => {
      setIsDeletedDialogOpen(true);
    };

    const handleBoardRemoved = (payload: { boardId: string, userId: string }) => {
      if (payload.userId === currentUser?.id) {
        setIsRemovedDialogOpen(true);
      }
    };

    socket.on("connect", joinRoom);
    socket.on("board:deleted", handleBoardDeleted);
    socket.on("board:removed", handleBoardRemoved);

    return () => { 
      socket.emit("board:leave", { boardId }); 
      socket.off("connect", joinRoom);
      socket.off("board:deleted", handleBoardDeleted);
      socket.off("board:removed", handleBoardRemoved);
    };
  }, [boardId, currentUser]);

  return {
    isDeletedDialogOpen,
    isRemovedDialogOpen,
    setIsDeletedDialogOpen,
    setIsRemovedDialogOpen
  };
};
