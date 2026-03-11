import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../../../services/socket/socketClient";
import { baseApi } from "../../../services/api/baseApi";
import type { User } from "../../../store/auth/authSlice";

export const useWhiteboardSocket = (boardId: string | undefined, currentUser: User | null | undefined) => {
  const [isDeletedDialogOpen, setIsDeletedDialogOpen] = useState(false);
  const [isRemovedDialogOpen, setIsRemovedDialogOpen] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!boardId) return;

    const joinRoom = () => {
      socket.emit("board:join", { boardId });
    };

    joinRoom();

    const handleBoardDeleted = () => {
      setIsDeletedDialogOpen(true);
    };

    const handleBoardRemoved = (payload: { boardId: string; userId: string }) => {
      if (payload.userId === currentUser?.id) {
        setIsRemovedDialogOpen(true);
      }
    };

    const handleBoardDataChanged = () => {
      dispatch(baseApi.util.invalidateTags(["Board"]));
    };

    socket.on("connect", joinRoom);
    socket.on("board:deleted", handleBoardDeleted);
    socket.on("board:removed", handleBoardRemoved);
    socket.on("board:role_updated", handleBoardDataChanged);
    socket.on("board:members_updated", handleBoardDataChanged);

    return () => {
      socket.emit("board:leave", { boardId });
      socket.off("connect", joinRoom);
      socket.off("board:deleted", handleBoardDeleted);
      socket.off("board:removed", handleBoardRemoved);
      socket.off("board:role_updated", handleBoardDataChanged);
      socket.off("board:members_updated", handleBoardDataChanged);
    };
  }, [boardId, currentUser, dispatch]);

  return {
    isDeletedDialogOpen,
    isRemovedDialogOpen,
    setIsDeletedDialogOpen,
    setIsRemovedDialogOpen
  };
};
