import { Request, Response } from "express";

import {
  createElement,
  getBoardElements,
  updateElement,
  deleteElement
} from "./element.service";

import { successResponse } from "../../common/utils/response.utils";

export const createElementController = async (
  req: Request,
  res: Response
) => {

  const userId = req.user?.id;

  const { id } = req.params;

  const element = await createElement(
    id as string,
    userId!,
    req.body
  );

  return successResponse(res, "Element created", element);
};

export const getElementsController = async (
  req: Request,
  res: Response
) => {

  const { id } = req.params;

  const elements = await getBoardElements(id as string);

  return successResponse(res, "Elements fetched", elements);
};

export const updateElementController = async (
  req: Request,
  res: Response
) => {

  const userId = req.user?.id;

  const { elementId } = req.params;

  const element = await updateElement(
    elementId as string,
    userId!,
    req.body
  );

  return successResponse(res, "Element updated", element);
};

export const deleteElementController = async (
  req: Request,
  res: Response
) => {

  const { elementId } = req.params;

  await deleteElement(elementId as string);

  return successResponse(res, "Element deleted");
};