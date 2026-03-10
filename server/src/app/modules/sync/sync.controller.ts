import { Request, Response } from "express";

import { processSync } from "./sync.service";

import { successResponse } from "../../common/utils/response.utils";

export const syncController = async (
  req: Request,
  res: Response
) => {

  const { id } = req.params;

  const userId = req.user?.id;

  const { operations } = req.body;

  const result = await processSync(
    id as string,
    operations,
    userId as string
  );

  return successResponse(
    res,
    "Sync completed",
    result
  );
};