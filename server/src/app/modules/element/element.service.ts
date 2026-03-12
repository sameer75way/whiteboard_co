import { Types } from "mongoose";
import { ElementModel, type IElement, type LamportTimestamp } from "./element.model";
import { AppError } from "../../common/middlewares/errorHandler";
import { isNewer } from "../../common/utils/crdt.utils";

export const createElement = async (
  boardId: string,
  userId: string,
  payload: Partial<IElement>
) => {

  const element = await ElementModel.create({
    ...payload,
    _id: payload._id || new Types.ObjectId().toHexString(),
    boardId: new Types.ObjectId(boardId),
    createdBy: new Types.ObjectId(userId),
    updatedBy: new Types.ObjectId(userId)
  });

  return element;
};

export const getBoardElements = async (boardId: string) => {

  const elements = await ElementModel.find({
    boardId: new Types.ObjectId(boardId)
  });

  return elements;
};

export const updateElement = async (
  elementId: string,
  userId: string,
  payload: Partial<IElement>,
  incomingTs?: LamportTimestamp
): Promise<{ element: IElement; accepted: boolean }> => {

  const element = await ElementModel.findById(elementId);

  if (!element) {
    throw new AppError("Element not found", 404);
  }

  if (incomingTs && element.lamportTs) {
    if (!isNewer(incomingTs, element.lamportTs)) {
      return { element: element.toObject() as IElement, accepted: false };
    }
  }

  const restrictedFields = ["_id", "boardId", "createdBy", "createdAt", "updatedAt"];
  const filteredPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => !restrictedFields.includes(key))
  );

  Object.assign(element, filteredPayload);
  element.version += 1;
  element.updatedBy = new Types.ObjectId(userId);

  if (incomingTs) {
    element.lamportTs = incomingTs;
  }

  await element.save();

  return { element: element.toObject() as IElement, accepted: true };
};

export const deleteElement = async (
  elementId: string
) => {

  const element = await ElementModel.findById(elementId);

  if (!element) {
    throw new AppError("Element not found", 404);
  }

  await element.deleteOne();
};