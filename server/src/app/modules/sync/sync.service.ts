import { Types } from "mongoose";
import { ElementModel, type IElement } from "../element/element.model";

interface SyncOperation {
  elementId: string;
  operation: "create" | "update" | "delete";
  payload?: Partial<IElement>;
  clientVersion: number;
}

export const processSync = async (
  boardId: string,
  operations: SyncOperation[],
  userId: string
) => {

  const applied: (IElement | { deleted: string })[] = [];
  const rejected: SyncOperation[] = [];

  for (const op of operations) {

    const element = await ElementModel.findById(op.elementId);

    if (!element) {
      rejected.push(op);
      continue;
    }

    if (element.version > op.clientVersion) {

      rejected.push(op);

      continue;
    }

    if (op.operation === "update") {

      Object.assign(element, op.payload);

      element.version += 1;

      element.updatedBy = new Types.ObjectId(userId);

      await element.save();

      applied.push(element);

    }

    if (op.operation === "delete") {

      await element.deleteOne();

      applied.push({ deleted: op.elementId });

    }

  }

  const currentState = await ElementModel.find({ boardId });

  return {
    applied,
    rejected,
    currentState
  };
};