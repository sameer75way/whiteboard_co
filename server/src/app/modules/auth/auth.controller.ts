import { Request, Response } from "express";
import { registerUser, loginUser, forgotPassword, resetPassword, getAllUsers, getUserProfile, refreshAuthTokens } from "./auth.service";
import { successResponse } from "../../common/utils/response.utils"
import { env } from "../../common/config/env.config";
import { sendEmail } from "../../common/utils/email.utils";
import { catchAsync } from "../../common/utils/catchAsync";

export const registerController = catchAsync(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const data = await registerUser(email, password, name);

  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return successResponse(res, "User registered", {
    user: {
      ...data.user.toObject(),
      id: data.user._id
    },
    accessToken: data.accessToken
  });
});

export const loginController = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const data = await loginUser(email, password);

  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return successResponse(res, "Login successful", {
    user: {
      ...data.user.toObject(),
      id: data.user._id
    },
    accessToken: data.accessToken
  });
});

export const forgotPasswordController = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const resetToken = await forgotPassword(email);

  const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    email,
    subject: 'Password reset token',
    template: 'resetPassword',
    data: { resetUrl }
  });

  return successResponse(res, "Email sent");
});

export const resetPasswordController = catchAsync(async (req: Request, res: Response) => {
  const token = req.params.token;
  const { password } = req.body;

  const data = await resetPassword(token as string, password);

  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return successResponse(res, "Password reset successful", {
    user: {
      ...data.user.toObject(),
      id: data.user._id
    },
    accessToken: data.accessToken
  });
});

export const meController = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as Request & { user?: { id: string } }).user?.id;
  const user = await getUserProfile(userId!);
  return successResponse(res, "User profile", user);
});

export const refreshController = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "No refresh token provided" });
  }

  const { newAccessToken, newRefreshToken } = await refreshAuthTokens(refreshToken);

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return successResponse(res, "Token refreshed", { accessToken: newAccessToken });
});

export const getAllUsersController = catchAsync(async (_req: Request, res: Response) => {
  const users = await getAllUsers();
  return successResponse(res, "All users fetched", users);
});