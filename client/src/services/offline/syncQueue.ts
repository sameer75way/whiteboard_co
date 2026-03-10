import { db } from "./offlineDB";
import type { OfflineOperation } from "./offlineDB";

export const addOfflineOperation = async (operation: Omit<OfflineOperation, "id">) => {

  await db.operations.add(operation);

};

export const getOfflineOperations = async () => {

  return db.operations.toArray();

};

export const clearOfflineOperations = async () => {

  await db.operations.clear();

};