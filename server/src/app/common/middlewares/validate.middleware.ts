import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "./errorHandler";

export const validateBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }));
      throw new AppError("Validation failed", 400, errors);
    }

    req.body = result.data;

    next();
  };

export const validateParams =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {

    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }));
      throw new AppError("Validation failed", 400, errors);
    }

    req.params = result.data as Request["params"];

    next();
  };

export const validateQuery =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {

    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }));
      throw new AppError("Validation failed", 400, errors);
    }

    req.query = result.data as Request["query"];

    next();
  };