import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store/index";
import { styled, keyframes } from '@mui/material/styles';
import { syncOfflineOperations } from "../../../../services/offline/syncService";
import { socket } from "../../../../services/socket/socketClient";

const statusPulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
`;

const StatusBarContainer = styled('div')({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "8px 4px",
  fontSize: 10,
  fontWeight: 600,
  color: "rgba(255,255,255,0.7)",
  userSelect: "none",
  width: "100%",
});

const StatusDot = styled('span')<{ pulse: boolean; dotcolor: string }>(({ pulse, dotcolor }) => ({
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: dotcolor,
  display: "inline-block",
  boxShadow: `0 0 6px ${dotcolor}`,
  animation: pulse ? `${statusPulse} 1.5s ease-in-out infinite` : "none",
}));

export const ConnectionStatusBar = ({ boardId }: { boardId: string }) => {
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [socketConnected, setSocketConnected] = useState<boolean>(socket.connected);
  const reduxSyncing = useSelector((state: RootState) => state.sync.syncing);

  useEffect(() => {
    const triggerSync = async () => {
      setSyncing(true);
      await syncOfflineOperations();
      setTimeout(() => setSyncing(false), 2000);
    };

    const handleOnline = () => {
      setOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setOnline(false);
      setSyncing(false);
    };

    const handleSocketConnect = () => {
      setSocketConnected(true);
      triggerSync();
    };

    const handleSocketDisconnect = () => {
      setSocketConnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    socket.on("connect", handleSocketConnect);
    socket.on("disconnect", handleSocketDisconnect);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      socket.off("connect", handleSocketConnect);
      socket.off("disconnect", handleSocketDisconnect);
    };
  }, [boardId]);

  const isSyncing = syncing || reduxSyncing;
  const isConnected = online && socketConnected;
  const label = !online ? "Offline" : !socketConnected ? "Reconnecting" : isSyncing ? "Syncing" : "Online";
  const color = !isConnected ? "#ef4444" : isSyncing ? "#f59e0b" : "#10b981";
  const pulse = !isConnected || isSyncing;

  return (
    <StatusBarContainer>
      <StatusDot pulse={pulse} dotcolor={color} />
      <span>{label}</span>
    </StatusBarContainer>
  );
};