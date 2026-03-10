import { Request, Response } from "express";
import "../../common/types/expressTypes";
import { registerUser, loginUser, forgotPassword, resetPassword, getAllUsers } from "./auth.service";
import { successResponse } from "../../common/utils/response.utils"
import { env } from "../../common/config/env.config";
import { sendEmail } from "../../common/utils/email.utils";
import { verifyRefreshToken } from "../../common/utils/jwt.utils";
import { signAccessToken, signRefreshToken } from "../../common/utils/jwt.utils";
import { RefreshTokenModel } from "../token/refreshToken.model";
import { AppError } from "../../common/middlewares/errorHandler";
import { catchAsync } from "../../common/utils/catchAsync";

export const registerController = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const data = await registerUser(email, password, name);

  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    sameSite: "strict"
  });

  return successResponse(res, "User registered", {
    user: {
      ...data.user.toObject(),
      id: data.user._id
    },
    accessToken: data.accessToken
  });
};

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const data = await loginUser(email, password);

  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    sameSite: "strict"
  });

  return successResponse(res, "Login successful", {
    user: {
      ...data.user.toObject(),
      id: data.user._id
    },
    accessToken: data.accessToken
  });
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  const { email } = req.body;
  const resetToken = await forgotPassword(email);

  const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email,
      subject: 'Password reset token',
      message
    });

    return successResponse(res, "Email sent");
  } catch {
    throw new AppError("Email could not be sent", 500);
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  const token = req.params.token;
  const { password } = req.body;

  const data = await resetPassword(token as string, password);

  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    sameSite: "strict"
  });

  return successResponse(res, "Password reset successful", {
    user: {
      ...data.user.toObject(),
      id: data.user._id
    },
    accessToken: data.accessToken
  });
};

import { UserModel } from "./auth.model";

export const meController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const user = await UserModel.findById(userId).select("-password");

  return successResponse(res, "User profile", user);
};

export const refreshController = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new AppError("No refresh token provided", 401);
  }

  const decoded = verifyRefreshToken(refreshToken) as { id: string };

  const storedToken = await RefreshTokenModel.findOne({ 
    token: refreshToken, 
    userId: decoded.id,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });

  if (!storedToken) {
    throw new AppError("Refresh token is invalid or expired", 401);
  }

  storedToken.isRevoked = true;
  await storedToken.save();

  const newAccessToken = signAccessToken({ id: decoded.id });
  const newRefreshToken = signRefreshToken({ id: decoded.id });

  await RefreshTokenModel.create({
    userId: decoded.id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    sameSite: "strict"
  });

  return successResponse(res, "Token refreshed", { accessToken: newAccessToken });
});

export const getAllUsersController = catchAsync(async (_req: Request, res: Response) => {
  const users = await getAllUsers();
  return successResponse(res, "All users fetched", users);
});