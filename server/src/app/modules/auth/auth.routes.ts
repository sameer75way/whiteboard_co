import { Router } from "express";

import { registerController, loginController, meController, forgotPasswordController, resetPasswordController, refreshController, getAllUsersController } from "./auth.controller";

import { validateBody } from "../../common/middlewares/validate.middleware";

import { registerSchema } from "./validation/register.schema";
import { loginSchema } from "./validation/login.schema";
import { forgotPasswordSchema, resetPasswordSchema } from "./validation/reset.schema";
import { authMiddleware } from "../../common/middlewares/auth.middleware";
import { requireRole } from "../../common/middlewares/rbac.middleware";

export const authRoutes = Router();

authRoutes.post(
    "/register",
    validateBody(registerSchema),
    registerController
);

authRoutes.post(
    "/login",
    validateBody(loginSchema),
    loginController
);

authRoutes.post(
    "/forgot-password",
    validateBody(forgotPasswordSchema),
    forgotPasswordController
);

authRoutes.post(
    "/reset-password/:token",
    validateBody(resetPasswordSchema),
    resetPasswordController
);

authRoutes.get("/me", authMiddleware, meController);
authRoutes.post("/refresh", refreshController);

authRoutes.get("/admin/users", authMiddleware, requireRole(["Admin"]), getAllUsersController);