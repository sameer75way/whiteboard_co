import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { type RootState } from "../../store/index";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { CanvasBoard } from "./components/Canvas/CanvasBoard";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { StylePanel } from "./components/Toolbar/StylePanel";
import { CollaboratorCursors } from "./components/Collab/CollaboratorCursors";
import { ConnectionStatusBar } from "./components/Sync/ConnectionStatusBar";
import { setElements } from "../../store/canvas/canvasSlice";
import { useGetBoardElementsQuery } from "../../services/api/elementApi";
import { useGetBoardQuery } from "../../services/api/boardApi";

import { WhiteboardHeader } from "./components/layout/WhiteboardHeader";
import { WhiteboardModals } from "./components/layout/WhiteboardModals";
import { useWhiteboardCommands } from "./hooks/useWhiteboardCommands";
import { useWhiteboardSocket } from "./hooks/useWhiteboardSocket";

export const WhiteboardPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  useOfflineSync();

  const [isAccessModalOpen, setAccessModalOpen] = useState(false);
  const [shareSnackbarOpen, setShareSnackbarOpen] = useState(false);

  const { data: boardData, refetch: refetchBoard } = useGetBoardQuery(id!, { skip: !id });
  const board = boardData?.data;

  const currentMember = board?.members?.find(
    (m: { user: string | { _id: string }; role: string }) => 
      m.user === currentUser?.id || (typeof m.user === 'object' && m.user?._id === currentUser?.id)
  );
  
  const isViewer = currentMember?.role === "Viewer" || !currentMember;
  const isOwner = currentMember?.role === "Owner";

  const {
    handleCreateRectangle,
    handleCreateCircle,
    handleCreateTriangle,
    handleCreateLine,
    handleCreateText,
    handleCreateSticky,
    handleDelete,
    computeStateDiffAndSync,
    selectedElementId
  } = useWhiteboardCommands(id);

  const {
    isDeletedDialogOpen,
    isRemovedDialogOpen,
  } = useWhiteboardSocket(id, currentUser);

  const copyShareCode = useCallback(() => {
    if (board?.shareCode) {
      navigator.clipboard.writeText(board.shareCode);
      setShareSnackbarOpen(true);
    }
  }, [board]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey && e.shiftKey && e.key === "Z") { computeStateDiffAndSync('redo'); return; }
      if (e.ctrlKey && e.key === "z") { computeStateDiffAndSync('undo'); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) handleDelete();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedElementId, handleDelete, computeStateDiffAndSync]);

  const { data: elementsData } = useGetBoardElementsQuery(id!, { skip: !id });
  useEffect(() => {
    if (elementsData?.data) {
      dispatch(setElements(elementsData.data));
    }
  }, [elementsData, dispatch]);

  if (!id) return null;

  return (
    <div
      id="whiteboard-container"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: '#0f172a',
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        overflow: 'hidden'
      }}
    >
      <WhiteboardHeader 
        isOwner={isOwner} 
        onShareCode={copyShareCode}
        onManageAccess={() => setAccessModalOpen(true)}
      />

      {!isViewer && (
        <>
          <Toolbar
            onRectangle={handleCreateRectangle}
            onCircle={handleCreateCircle}
            onTriangle={handleCreateTriangle}
            onLine={handleCreateLine}
            onText={handleCreateText}
            onSticky={handleCreateSticky}
            onDelete={handleDelete}
            onUndo={() => computeStateDiffAndSync('undo')}
            onRedo={() => computeStateDiffAndSync('redo')}
            hasSelection={!!selectedElementId}
          />
          {selectedElementId && <StylePanel boardId={id} />}
        </>
      )}

      <CanvasBoard boardId={id} />

      <CollaboratorCursors />

      <ConnectionStatusBar />

      <WhiteboardModals
        boardId={id}
        isAccessModalOpen={isAccessModalOpen}
        isDeletedDialogOpen={isDeletedDialogOpen}
        isRemovedDialogOpen={isRemovedDialogOpen}
        shareSnackbarOpen={shareSnackbarOpen}
        onCloseAccess={() => setAccessModalOpen(false)}
        onCloseShareSnackbar={() => setShareSnackbarOpen(false)}
        board={board}
        isOwner={isOwner}
        refetchBoard={refetchBoard}
      />
    </div>
  );
};