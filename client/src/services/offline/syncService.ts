import { db } from "./offlineDB";
import { socket } from "../socket/socketClient";

export const syncOfflineOperations = async () => {
  const operations = await db.operations.toArray();
  if (!operations.length) return;

  const commentOps = operations.filter((op): op is typeof operations[0] => op.operation.startsWith("comment:"));
  const elementOps = operations.filter((op): op is typeof operations[0] => !op.operation.startsWith("comment:"));

  try {
    await syncCommentOperations(commentOps);
  } catch (error) {
    console.error("Comment sync failed, retaining operations", error);
    return;
  }

  if (elementOps.length > 0) {
    const acknowledged = await syncElementsViaSocket(elementOps);
    if (!acknowledged) {
      console.error("Element sync not acknowledged, retaining operations");
      return;
    }
  }

  await db.operations.clear();
};

const syncCommentOperations = async (commentOps: any[]) => {
  if (!commentOps.length) return;

  const { store } = await import("../../store/index");
  const state = store.getState();
  const token = state.auth.accessToken;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  for (const op of commentOps) {
    if (op.operation === "comment:create") {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/elements/${op.elementId}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify(op.payload)
      });
      if (!res.ok) throw new Error(`Comment create failed: ${res.status}`);
    } else if (op.operation === "comment:reply") {
      const payloadStr = JSON.stringify(op.payload);
      const { parentCommentId, ...rest } = JSON.parse(payloadStr);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/elements/${op.elementId}/comments/${parentCommentId}/replies`, {
        method: "POST",
        headers,
        body: JSON.stringify(rest)
      });
      if (!res.ok) throw new Error(`Comment reply failed: ${res.status}`);
    } else if (op.operation === "comment:delete") {
      const commentId = op.payload.commentId;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/elements/${op.elementId}/comments/${commentId}`, {
        method: "DELETE",
        headers
      });
      if (!res.ok) throw new Error(`Comment delete failed: ${res.status}`);
    }
  }
};

const syncElementsViaSocket = (elementOps: any[]): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 15000);

    socket.once("sync:acknowledged", () => {
      clearTimeout(timeout);
      resolve(true);
    });

    socket.emit("sync:operations", elementOps);
  });
};