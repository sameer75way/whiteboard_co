import Dexie, { type Table } from "dexie";
import type { LamportTimestamp } from "../../types/element.types";

export interface OfflineOperation {
  id?: number;
  boardId: string;
  elementId: string;
  operation: "create" | "update" | "delete" | "comment:create" | "comment:reply" | "comment:delete";
  payload: Record<string, any>;
  clientVersion: number;
  lamportTs?: LamportTimestamp;
}

class WhiteboardDB extends Dexie {

  operations!: Table<OfflineOperation>;

  constructor() {
    super("whiteboardDB");

    this.version(1).stores({
      operations: "++id, boardId, elementId"
    });
  }

}

export const db = new WhiteboardDB();