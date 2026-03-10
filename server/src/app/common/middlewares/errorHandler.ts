import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  errors?: Record<string, string>[];

  constructor(message: string, statusCode: number, errors?: Record<string, string>[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.statusCode || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    ...(err.errors && { errors: err.errors })
  });
};