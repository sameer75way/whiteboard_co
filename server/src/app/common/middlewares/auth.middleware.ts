import { Request, Response, NextFunction } from "express";
import "../types/expressTypes";
import { verifyAccessToken } from "../utils/jwt.utils";
import { AppError } from "./errorHandler";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Unauthorized", 401);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    const decoded = verifyAccessToken(token) as { id: string; role?: string };

    req.user = {
      id: decoded.id,
      role: decoded.role ?? "User"
    };

    next();
  } catch (error) {
    throw new AppError("Invalid token", 401);
  }
};