// controllers/auth.controller.js
import Admin from "../models/Admin.js";
import * as AuthService from "../services/auth.service.js";
import { generateAccessToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";

const maxAgeInMilliseconds = 7 * 24 * 60 * 60 * 1000;

export const register = async (req, res) => {
  try {
    const user = await AuthService.registerAdmin(req.body);
    res.status(201).json({ message: "Registered successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const data = await AuthService.loginAdmin(req.body);

    res.cookie(
      "refreshToken",
      data.refreshToken,
      process.env.production === "false"
        ? {
            // httpOnly: true,
            secure: false,
            sameSite: "Lax",
            path: "/",
            maxAge: maxAgeInMilliseconds,
          }
        : {
            httpOnly: true,
            secure: true,
            domain: ".mariaconcepts.com",
            sameSite: "none",
            path: "/",
            maxAge: maxAgeInMilliseconds,
          },
    );

    res.json({
      message: "Login successful",
      accessToken: data.accessToken,
      user: {
        id: data.admin._id,
        name: data.admin.name,
        email: data.admin.email,
      },
    });

    // res.json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  try {
    if (refreshToken) {
      await Admin.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    }

    res.clearCookie(
      "refreshToken",
      process.env.production === "false"
        ? {
            // httpOnly: true,
            secure: false,
            sameSite: "Lax",
            path: "/",
            maxAge: maxAgeInMilliseconds,
          }
        : {
            httpOnly: true,
            secure: true,
            domain: ".mariaconcepts.com",
            sameSite: "none",
            path: "/",
            maxAge: maxAgeInMilliseconds,
          },
    );
    res.status(204).json({ message: "Logged out" });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

export const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  const admin = await Admin.findOne({ refreshToken });
  if (!admin) return res.sendStatus(403);

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);

    const accessToken = generateAccessToken(admin);
    res.json({ accessToken });
  });
};
