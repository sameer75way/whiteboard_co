import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";
import "../types/expressTypes";

export const requireRole =
  (roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      throw new AppError("Forbidden", 403);
    }

    next();
  };