// controllers/auth.controller.js
import * as AuthService from "../services/auth.service.js";

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

    res.cookie("token", data.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
    });

    res.json({ message: "Login successful" });

    // res.json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", { path: "/" });
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
