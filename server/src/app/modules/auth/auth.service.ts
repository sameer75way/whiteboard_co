import * as crypto from "crypto";
import { UserModel } from "./auth.model";
import { hashPassword, comparePassword } from "../../common/utils/password.utils";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/utils/jwt.utils";
import { RefreshTokenModel } from "../token/refreshToken.model";
import { AppError } from "../../common/middlewares/errorHandler";

export const registerUser = async (
  email: string,
  password: string,
  name: string
) => {
  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    throw new AppError("Email already registered", 400);
  }

  const hashedPassword = await hashPassword(password);

  const user = await UserModel.create({
    email,
    password: hashedPassword,
    name
  });

  const accessToken = signAccessToken({ id: user._id, role: user.role });

  const refreshToken = signRefreshToken({ id: user._id });

  await RefreshTokenModel.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return { user, accessToken, refreshToken };
};

export const loginUser = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const validPassword = await comparePassword(password, user.password);

  if (!validPassword) {
    throw new AppError("Invalid credentials", 401);
  }

  const accessToken = signAccessToken({ id: user._id, role: user.role });

  const refreshToken = signRefreshToken({ id: user._id });

  await RefreshTokenModel.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return { user, accessToken, refreshToken };
};

export const forgotPassword = async (email: string) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AppError("There is no user with that email", 404);
  }

  const resetToken = crypto.randomBytes(20).toString('hex');

  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.resetPasswordExpire = new Date(Date.now() + 3 * 60 * 1000);

  await user.save();

  return resetToken;
};

export const resetPassword = async (resetToken: string, newPassword: string) => {

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await UserModel.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError("Invalid or expired password reset token", 400);
  }

  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id });

  await RefreshTokenModel.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return { user, accessToken, refreshToken };
};

export const getAllUsers = async () => {
  return await UserModel.find().select("-password -__v -resetPasswordToken -resetPasswordExpire").lean();
};

export const getUserProfile = async (userId: string) => {
  return await UserModel.findById(userId).select("-password");
};

export const refreshAuthTokens = async (refreshToken: string) => {
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

  return { newAccessToken, newRefreshToken };
};