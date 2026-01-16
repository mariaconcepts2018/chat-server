import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import chatServer from "./chatServer.js";
import mongoose from "mongoose";
import {
  addLead,
  fetchCounts,
  fetchUser,
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
import { register, login, logout } from "./controllres/auth.controller.js";
import profileRoutes from "./routes/profile.routes.js";
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
  })
);
app.use(express.urlencoded({ extended: true }));

app.use("/api", profileRoutes);

chatServer(io);

mongoose
  .connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME })
  .then(() => console.log("PostUser: MongoDB connected:"))
  .catch((err) => console.error("PostUser: MongoDB connection error:", err));

app.set("trust proxy", 1);

app.post("/whatsapp", twilioWebhook);

// POST route to store user data
app.post("/api/send-otp", sendOtp);
app.post("/api/verify-otp", verifyOtp);
app.post("/api/update-user", updateUser);

app.post("/api/admin/add-lead", protect, addLead);
app.get("/api/admin/users", protect, fetchUsers);
app.get("/api/admin/users-xlsx", protect, fetchUsersXlsx);
app.get("/api/admin/users/:userId", protect, fetchUser);
app.get("/api/admin/users-count", protect, fetchCounts);
app.post("/api/admin/update-user/:userId", protect, updateUserAdmin);
app.post("/api/admin/uploadFile", protect, upload.single("file"), uploadFile);
app.post("/api/auth/logout", protect, logout);
app.get("/api/profile", protect, getProfile);

app.post("/auth/register", register);
app.post("/auth/login", login);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
