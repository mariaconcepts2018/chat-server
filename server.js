import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import chatServer from "./chatServer.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import {
  addLead,
  fetchChats,
  fetchCounts,
  fetchPrevChats,
  fetchUser,
  fetchUserChats,
  fetchUsers,
  fetchUsersXlsx,
  sendOtp,
  updateUser,
  updateUserAdmin,
  uploadFile,
  verifyOtp,
} from "./route.js";
import { Server } from "socket.io";
import multer from "multer";
import twilioWebhook from "./twilioWebhook.js";
import {
  register,
  login,
  logout,
  refresh,
} from "./controllres/auth.controller.js";
// import profileRoutes from "./routes/profile.routes.js";
import { getProfile } from "./controllres/profile.controller.js";
import { protect } from "./middlewares/auth.middleware.js";
import cookieParser from "cookie-parser";

const upload = multer({ dest: "uploads/" });

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_1,
      process.env.FRONTEND_2,
      process.env.FRONTEND_ADMIN,
    ],
    credentials: true,
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      process.env.FRONTEND_1,
      process.env.FRONTEND_2,
      process.env.FRONTEND_ADMIN,
    ], // Next.js dev URL
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

// app.use("/api", profileRoutes);

io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(" ")[1];

  if (!token) return next(); // allow public users

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.admin = decoded;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

chatServer(io);

mongoose
  .connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME })
  .then(() => console.log("MongoDB connected:"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.set("trust proxy", 1);

app.post("/whatsapp", twilioWebhook);

// POST route to store user data
app.post("/api/send-otp", sendOtp);
app.post("/api/verify-otp", verifyOtp);
app.post("/api/update-user", updateUser);
app.get("/api/chat/:roomId/messages", fetchUserChats);

app.post("/api/admin/add-lead", protect, addLead);
app.get("/api/admin/users", protect, fetchUsers);
app.get("/api/admin/users-xlsx", protect, fetchUsersXlsx);
app.get("/api/admin/users/:userId", protect, fetchUser);
app.get("/api/admin/users-count", protect, fetchCounts);
app.post("/api/admin/update-user/:userId", protect, updateUserAdmin);
app.post("/api/admin/uploadFile", protect, upload.single("file"), uploadFile);
app.get("/api/admin/unread-chats", protect, fetchChats);
app.get("/api/admin/chat/:roomId/messages", protect, fetchPrevChats);
app.get("/api/profile", protect, getProfile); //need to be changed

app.post("/auth/logout", logout);
app.post("/auth/register", register);
app.post("/auth/login", login);
app.post("/auth/refresh", refresh);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Running on: http://localhost:${PORT}`);
});
