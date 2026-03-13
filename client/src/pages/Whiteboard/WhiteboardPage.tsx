import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { type RootState } from "../../store/index";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { CanvasBoard } from "./components/Canvas/CanvasBoard";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { StylePanel } from "./components/Toolbar/StylePanel";
import { ConnectionStatusBar } from "./components/Sync/ConnectionStatusBar";
import { LayersPanel } from "./components/LayersPanel/index";
import { setElements } from "../../store/canvas/canvasSlice";
import { setLayers } from "../../store/layers/layersSlice";
import { removeNotification } from "../../store/notifications/notificationsSlice";
import { useGetBoardElementsQuery } from "../../services/api/elementApi";
import { useGetBoardQuery } from "../../services/api/boardApi";
import { useSnackbar } from "notistack";

import { WhiteboardHeader } from "./components/layout/WhiteboardHeader";
import { WhiteboardModals } from "./components/layout/WhiteboardModals";
import { useWhiteboardCommands } from "./hooks/useWhiteboardCommands";
import { useWhiteboardSocket } from "./hooks/useWhiteboardSocket";
import { styled } from '@mui/material/styles';

const WhiteboardContainer = styled('div')({
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
});

export const WhiteboardPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const layerState = useSelector((state: RootState) => state.layers);
  const { enqueueSnackbar } = useSnackbar();

  useOfflineSync();

  const activeLayer = layerState.layers.find(l => l.id === layerState.activeLayerId);
  const isLayerLocked = activeLayer?.isLocked || false;

  const [isAccessModalOpen, setAccessModalOpen] = useState(false);
  const [shareSnackbarOpen, setShareSnackbarOpen] = useState(false);
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);

  const { data: boardData, refetch: refetchBoard } = useGetBoardQuery(id!, { skip: !id });
  const board = boardData?.data;

  const currentMember = board?.members?.find(
    (m: { user: string | { _id: string }; role: string }) => 
      m.user === currentUser?.id || (typeof m.user === 'object' && m.user?._id === currentUser?.id)
  );
  
  const isViewer = currentMember?.role === "Viewer" || !currentMember;
  const isOwner = currentMember?.role === "Owner";
  const userRole: "Owner" | "Collaborator" | "Viewer" = isOwner
    ? "Owner"
    : isViewer
      ? "Viewer"
      : "Collaborator";

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

  const setupKeyboardShortcuts = useCallback(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isViewer || isLayerLocked) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey && e.shiftKey && e.key === "Z") { computeStateDiffAndSync('redo'); return; }
      if (e.ctrlKey && e.key === "z") { computeStateDiffAndSync('undo'); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) handleDelete();
    };
    
    window.addEventListener("keydown", handleKey);
    
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedElementId, handleDelete, computeStateDiffAndSync, isViewer, isLayerLocked]);

  useEffect(() => {
    const cleanup = setupKeyboardShortcuts();
    return cleanup;
  }, [setupKeyboardShortcuts]);

  const { data: elementsData } = useGetBoardElementsQuery(id!, { skip: !id });
  useEffect(() => {
    if (elementsData?.data) {
      dispatch(setElements(elementsData.data));
    }
  }, [elementsData, dispatch]);

  useEffect(() => {
    if (board?.layers) {
      dispatch(setLayers(board.layers));
    }
  }, [board?.layers, dispatch]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      enqueueSnackbar(latest.message, { variant: "warning", autoHideDuration: 4000 });
      dispatch(removeNotification(latest.id));
    }
  }, [notifications, enqueueSnackbar, dispatch]);

  if (!id) return <div>Invalid board ID</div>;

  return (
    <WhiteboardContainer id="whiteboard-container">
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
            onToggleLayers={() => setLayersPanelOpen(!layersPanelOpen)}
            isLayersOpen={layersPanelOpen}
            isLayerLocked={isLayerLocked}
          />
          {selectedElementId && <StylePanel boardId={id} />}
        </>
      )}

      <CanvasBoard boardId={id} isViewer={isViewer} />

      {layersPanelOpen && (
        <LayersPanel
          boardId={id}
          userRole={userRole}
          onClose={() => setLayersPanelOpen(false)}
        />
      )}

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
    </WhiteboardContainer>
  );
};