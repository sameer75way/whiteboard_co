import { Response } from "express";

export const successResponse = <T>(res: Response, message: string, data: T | null = null) => {
  return res.status(200).json({
    success: true,
    message,
    data
  });
};
