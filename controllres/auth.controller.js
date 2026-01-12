// controllers/auth.controller.js
import * as AuthService from "../services/auth.service.js";

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
      "token",
      data.accessToken,
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
          }
    );

    res.json({
      message: "Login successful",
      token: data.accessToken,
      user: {
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
  try {
    res.clearCookie(
      "token",
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
          }
    );
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
