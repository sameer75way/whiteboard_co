import Dexie, { type Table } from "dexie";
import type { LamportTimestamp, CanvasElement } from "../../types/element.types";

export type OfflineOperation =
  | {
      id?: number;
      boardId: string;
      elementId: string;
      operation: "create" | "update";
      payload: Partial<CanvasElement>;
      clientVersion: number;
      lamportTs: LamportTimestamp;
    }
  | {
      id?: number;
      boardId: string;
      elementId: string;
      operation: "delete";
      payload: Partial<CanvasElement>;
      clientVersion: number;
      lamportTs: LamportTimestamp;
    }
  | {
      id?: number;
      boardId: string;
      elementId: string;
      operation: "comment:create";
      payload: { content: string };
      clientVersion: number;
      lamportTs?: LamportTimestamp;
    }
  | {
      id?: number;
      boardId: string;
      elementId: string;
      operation: "comment:reply";
      payload: { content: string; parentCommentId: string };
      clientVersion: number;
      lamportTs?: LamportTimestamp;
    }
  | {
      id?: number;
      boardId: string;
      elementId: string;
      operation: "comment:delete";
      payload: { commentId: string };
      clientVersion: number;
      lamportTs?: LamportTimestamp;
    };

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