import { Types } from "mongoose";
import { ElementModel, type IElement, type LamportTimestamp } from "../element/element.model";
import { createElement, updateElement, deleteElement } from "../element/element.service";

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

  for (const op of operations) {

    if (op.operation === "create") {
      const existing = await ElementModel.findById(op.elementId);
      if (!existing && op.payload) {
        const el = await createElement(op.boardId ?? boardId, userId, op.payload);
        applied.push(el as IElement);
      }
      continue;
    }

    if (op.operation === "update" && op.payload) {
      try {
        const { element, accepted } = await updateElement(
          op.elementId,
          userId,
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
        await deleteElement(op.elementId);
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