import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../../../services/socket/socketClient";
import { baseApi } from "../../../services/api/baseApi";
import { setLastAutoSaveAt, prependSnapshot } from "../../../store/snapshot/snapshotSlice";
import { setElements, selectElement } from "../../../store/canvas/canvasSlice";
import { setLayers } from "../../../store/layers/layersSlice";
import { addNotification } from "../../../store/notifications/notificationsSlice";
import type { User } from "../../../store/auth/authSlice";
import type { CanvasElement } from "../../../types/element.types";
import type { Layer } from "../../../types/board.types";

interface SnapshotSavedPayload {
  snapshotId: string;
  name: string;
  type: "auto" | "manual" | "restore";
  savedAt: string;
}

interface BoardRestoredPayload {
  boardId: string;
  snapshotId: string;
  snapshotName: string;
  restoredBy: string;
  elements: CanvasElement[];
  layers: Layer[];
}

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

    const handleSnapshotSaved = (payload: SnapshotSavedPayload) => {
      if (payload.type === "auto") {
        dispatch(setLastAutoSaveAt(payload.savedAt));
      }
      dispatch(prependSnapshot({
        id: payload.snapshotId,
        boardId: boardId,
        type: payload.type,
        name: payload.name,
        createdBy: "system", 
        createdAt: payload.savedAt
      }));
    };

    const handleBoardRestored = (payload: BoardRestoredPayload) => {
      dispatch(selectElement(null));
      dispatch(setElements(payload.elements));
      dispatch(setLayers(payload.layers));
      dispatch(baseApi.util.invalidateTags(["Snapshot", "Board", "Elements"]));
      dispatch(addNotification({
        id: `restored-${Date.now()}`,
        message: `The board was restored to a previous version.`
      }));
    };

    const handleSnapshotDeleted = () => {
      dispatch(baseApi.util.invalidateTags(["Snapshot"]));
    };

    socket.on("connect", joinRoom);
    socket.on("board:deleted", handleBoardDeleted);
    socket.on("board:removed", handleBoardRemoved);
    socket.on("board:role_updated", handleBoardDataChanged);
    socket.on("board:members_updated", handleBoardDataChanged);
    socket.on("snapshot:saved", handleSnapshotSaved);
    socket.on("snapshot:deleted", handleSnapshotDeleted);
    socket.on("board:restored", handleBoardRestored);

    return () => {
      socket.emit("board:leave", { boardId });
      socket.off("connect", joinRoom);
      socket.off("board:deleted", handleBoardDeleted);
      socket.off("board:removed", handleBoardRemoved);
      socket.off("board:role_updated", handleBoardDataChanged);
      socket.off("board:members_updated", handleBoardDataChanged);
      socket.off("snapshot:saved", handleSnapshotSaved);
      socket.off("snapshot:deleted", handleSnapshotDeleted);
      socket.off("board:restored", handleBoardRestored);
    };
  }, [boardId, currentUser, dispatch]);

  return {
    isDeletedDialogOpen,
    isRemovedDialogOpen,
    setIsDeletedDialogOpen,
    setIsRemovedDialogOpen
  };
};
