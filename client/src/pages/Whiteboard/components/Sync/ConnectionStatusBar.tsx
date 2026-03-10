import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store/index";

export const ConnectionStatusBar = () => {

  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [syncing, setSyncing] = useState<boolean>(false);
  const reduxSyncing = useSelector((state: RootState) => state.sync.syncing);

  useEffect(() => {

    const handleOnline = () => {
      setOnline(true);
      setSyncing(true);
      setTimeout(() => setSyncing(false), 3000);
    };

    const handleOffline = () => {
      setOnline(false);
      setSyncing(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };

  }, []);

  const isSyncing = syncing || reduxSyncing;

  const label = !online ? "Offline" : isSyncing ? "Syncing…" : "Online";
  const color = !online ? "#ef4444" : isSyncing ? "#f59e0b" : "#10b981";
  const pulse = !online || isSyncing;

  return (
    <>
      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "7px 14px",
          fontSize: 13,
          fontWeight: 600,
          color: "rgba(255,255,255,0.9)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          zIndex: 100,
          userSelect: "none",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: color,
            display: "inline-block",
            boxShadow: `0 0 8px ${color}`,
            animation: pulse ? "statusPulse 1.5s ease-in-out infinite" : "none",
          }}
        />
        {label}
      </div>
    </>
  );
};