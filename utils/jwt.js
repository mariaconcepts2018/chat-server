// utils/jwt.js
import jwt from "jsonwebtoken";

export const generateAccessToken = (admin) =>
  jwt.sign(
    {
      id: admin._id,
      role: admin.role,

      name: admin.name,
      email: admin.email,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    }
  );

export const generateRefreshToken = (admin) =>
  jwt.sign({ id: admin._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
