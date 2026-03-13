import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { type RootState } from "../../store/index";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { CanvasBoard } from "./components/Canvas/CanvasBoard";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { StylePanel } from "./components/Toolbar/StylePanel";
import { LayersPanel } from "./components/LayersPanel/index";
import { VersionHistoryPanel } from "./components/VersionHistoryPanel/index";
import { SnapshotPreviewDialog } from "./components/VersionHistoryPanel/SnapshotPreviewDialog";
import { CommentPanel } from "./components/CommentPanel/index";
import { setElements } from "../../store/canvas/canvasSlice";
import { setLayers } from "../../store/layers/layersSlice";
import { removeNotification } from "../../store/notifications/notificationsSlice";
import { useGetBoardElementsQuery } from "../../services/api/elementApi";
import { useGetBoardQuery } from "../../services/api/boardApi";
import { useCreateManualSnapshotMutation } from "../../services/api/snapshotApi";
import { useSnackbar } from "notistack";

import { WhiteboardHeader } from "./components/layout/WhiteboardHeader";
import { WhiteboardModals } from "./components/layout/WhiteboardModals";
import { useWhiteboardCommands } from "./hooks/useWhiteboardCommands";
import { useWhiteboardSocket } from "./hooks/useWhiteboardSocket";
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from "@mui/material";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";

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

const AutoSaveIndicator = styled(Box)<{ visible: boolean }>(({ visible }) => ({
  position: "absolute",
  bottom: 72,
  right: 24,
  zIndex: 50,
  display: visible ? "flex" : "none",
  alignItems: "center",
  gap: "8px",
  padding: "8px 16px",
  background: "rgba(15, 23, 42, 0.75)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "30px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  transition: "all 0.3s ease",
}));

const computeAutoSaveLabel = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Auto-saved just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Auto-saved ${minutes} min ago`;
  return `Auto-saved at ${new Date(isoString).toLocaleTimeString()}`;
};

export const WhiteboardPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const layerState = useSelector((state: RootState) => state.layers);
  const lastAutoSaveAt = useSelector((state: RootState) => state.snapshot.lastAutoSaveAt);
  const totalSnapshots = useSelector((state: RootState) => state.snapshot.totalSnapshots);
  const { enqueueSnackbar } = useSnackbar();

  useOfflineSync();

  const activeLayer = layerState.layers.find(l => l.id === layerState.activeLayerId);
  const isLayerLocked = activeLayer?.isLocked || false;

  const [isAccessModalOpen, setAccessModalOpen] = useState(false);
  const [shareSnackbarOpen, setShareSnackbarOpen] = useState(false);
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [autoSaveLabel, setAutoSaveLabel] = useState("");
  const [autoSaveVisible, setAutoSaveVisible] = useState(false);

  const saveFormSchema = z.object({ name: z.string() });
  const { control: saveControl, handleSubmit: handleSaveSubmit, reset: resetSaveForm } = useForm({
    defaultValues: { name: "" },
    resolver: zodResolver(saveFormSchema)
  });

  const [createManualSnapshot] = useCreateManualSnapshotMutation();

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
    selectedElementId,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    executeDelete
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
      const targetEl = e.target as HTMLElement;
      if (targetEl.isContentEditable) return;
      if (e.ctrlKey && e.shiftKey && e.key === "Z") { computeStateDiffAndSync('redo'); return; }
      if (e.ctrlKey && e.key === "z") { computeStateDiffAndSync('undo'); return; }
      if (e.key === "Delete" && selectedElementId) handleDelete();
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

  useEffect(() => {
    if (!lastAutoSaveAt) {
      setAutoSaveLabel("");
      setAutoSaveVisible(false);
      return;
    }
    
    setAutoSaveLabel(computeAutoSaveLabel(lastAutoSaveAt));
    setAutoSaveVisible(true);
    
    const timeout = setTimeout(() => {
      setAutoSaveVisible(false);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [lastAutoSaveAt]);

  const handleOpenSaveDialog = () => {
    resetSaveForm({ name: `Version ${totalSnapshots + 1}` });
    setSaveDialogOpen(true);
  };
  const handleSaveVersion = async (data: { name: string }) => {
    if (!id || !data.name.trim()) return;
    setSaveDialogOpen(false);
    await createManualSnapshot({ boardId: id, name: data.name.trim() });
    enqueueSnackbar("Version saved", { variant: "success" });
  };

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
            boardId={id}
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
            onToggleHistory={() => setHistoryPanelOpen(!historyPanelOpen)}
            isHistoryOpen={historyPanelOpen}
            onSaveVersion={handleOpenSaveDialog}
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

      {autoSaveLabel && (
        <AutoSaveIndicator visible={autoSaveVisible}>
          <CloudDoneOutlinedIcon htmlColor="rgba(255,255,255,0.7)" fontSize="small" />
          <Typography variant="caption" color="rgba(255,255,255,0.8)" fontWeight={500}>
            {autoSaveLabel}
          </Typography>
        </AutoSaveIndicator>
      )}

      <VersionHistoryPanel
        open={historyPanelOpen}
        onClose={() => setHistoryPanelOpen(false)}
        boardId={id}
      />

      <SnapshotPreviewDialog />

      <CommentPanel />

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

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Version</DialogTitle>
        <form onSubmit={handleSaveSubmit(handleSaveVersion)}>
          <DialogContent>
            <Controller
              name="name"
              control={saveControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  autoFocus
                  fullWidth
                  margin="dense"
                  label="Version Name"
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder={`Version ${totalSnapshots + 1}`}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={() => setSaveDialogOpen(false)} variant="text">Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Sticky Note?</DialogTitle>
        <DialogContent>
          <Typography>
            Deleting this sticky note will also delete all its comments. Are you sure?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} variant="text">Cancel</Button>
          <Button onClick={() => { setDeleteConfirmOpen(false); executeDelete(); }} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </WhiteboardContainer>
  );
};