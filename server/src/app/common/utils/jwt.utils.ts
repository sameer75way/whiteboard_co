import jwt from "jsonwebtoken";
import { env } from "../config/env.config";
import { AppError } from "../middlewares/errorHandler";

export const signAccessToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
};

export const signRefreshToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
};

export const verifyAccessToken = (token: string): string | jwt.JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired access token", 401);
  }
};

export const verifyRefreshToken = (token: string): string | jwt.JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }
};
