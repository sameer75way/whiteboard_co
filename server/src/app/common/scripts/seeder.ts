import { UserModel } from "../../modules/auth/auth.model";
import { hashPassword } from "../utils/password.utils";
import { env } from "../config/env.config";

export const seedAdmin = async () => {
  try {
    const adminExists = await UserModel.findOne({ email: env.SUPERADMIN_EMAIL });

    if (!adminExists) {
      const hashedPassword = await hashPassword(env.SUPERADMIN_PASSWORD);

      await UserModel.create({
        email: env.SUPERADMIN_EMAIL,
        password: hashedPassword,
        name: env.SUPERADMIN_NAME,
        role: "Admin",
      });

      console.log("Superadmin seeded successfully");
    } else {
      console.log("Superadmin already exists");
    }
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      console.log("Superadmin already exists (handled node concurrency)");
    } else {
      console.error("Error seeding admin:", error);
    }
  }
};
