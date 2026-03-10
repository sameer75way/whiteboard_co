import { db } from "./offlineDB";

export const syncOfflineOperations = async (boardId: string) => {

  const operations = await db.operations.toArray();

  if (!operations.length) return;

  try {

    await fetch(
      `${import.meta.env.VITE_API_URL}/sync/boards/${boardId}/sync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ operations })
      }
    );

    await db.operations.clear();

  } catch {
  }

};