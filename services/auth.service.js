// services/auth.service.js
import Admin from "../models/Admin.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

export const registerAdmin = async ({ name, email, password }) => {
  const exists = await Admin.findOne({ email });
  if (exists) throw new Error("Admin already exists");
  if (name === "user" || name === "admin") throw new Error("Invalid Name");

  const hashed = await hashPassword(password);
  const admin = await Admin.create({ name, email, password: hashed });

  return admin;
};

export const loginAdmin = async ({ email, password }) => {
  const admin = await Admin.findOne({ email });
  if (!admin) throw new Error("Invalid credentials");

  const isMatch = await comparePassword(password, admin.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const refreshToken = generateRefreshToken(admin);

  admin.refreshToken = refreshToken;

  await admin.save();

  return {
    admin,
    accessToken: generateAccessToken(admin),
    refreshToken: refreshToken,
  };
};
