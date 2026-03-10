import Dexie, {type  Table } from "dexie";
import type { CanvasElement } from "../../types/element.types";

export interface OfflineOperation {
  id?: number;
  boardId: string;
  elementId: string;
  operation: "create" | "update" | "delete";
  payload: Partial<CanvasElement>;
  clientVersion: number;
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