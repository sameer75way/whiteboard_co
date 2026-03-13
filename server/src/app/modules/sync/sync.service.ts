import { Types } from "mongoose";
import { ElementModel, type IElement, type LamportTimestamp } from "../element/element.model";
import { createElement, updateElement, deleteElement } from "../element/element.service";
import { BoardModel } from "../board/board.model";

interface SyncOperation {
  elementId: string;
  boardId: string;
  operation: "create" | "update" | "delete";
  payload?: Partial<IElement>;
  lamportTs?: LamportTimestamp;
  clientVersion: number;
}

export const processSync = async (
  boardId: string,
  operations: SyncOperation[],
  userId: string
) => {

  const applied: (IElement | { deleted: string })[] = [];
  const rejected: { op: SyncOperation; authoritative: IElement }[] = [];

  const board = await BoardModel.findById(boardId);
  if (!board) {
    throw new Error("Board not found for sync");
  }

  const member = board.members.find(m => m.user.toString() === userId && m.status === "Accepted");
  const role = member?.role || "Viewer";

  for (const op of operations) {
    const canEdit = role === "Owner" || role === "Collaborator";
    if (!canEdit) continue;

    if (op.operation === "create") {
      const existing = await ElementModel.findById(op.elementId);
      if (!existing && op.payload) {
        const el = await createElement(op.boardId ?? boardId, userId, role, op.payload);
        applied.push(el as IElement);
      }
      continue;
    }

    if (op.operation === "update" && op.payload) {
      try {
        const { element, accepted } = await updateElement(
          op.elementId,
          userId,
          role,
          op.payload,
          op.lamportTs
        );
        if (accepted) {
          applied.push(element);
        } else {
          rejected.push({ op, authoritative: element });
        }
      } catch {
        continue;
      }
      continue;
    }

    if (op.operation === "delete") {
      try {
        await deleteElement(op.elementId, userId, role);
        applied.push({ deleted: op.elementId });
      } catch {
        continue;
      }
      continue;
    }
  }

  const currentState = await ElementModel.find({
    boardId: new Types.ObjectId(boardId)
  });

  return {
    applied,
    rejected,
    currentState
  };
};