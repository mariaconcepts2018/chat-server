import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import chatServer from "./chatServer.js";
import path from "path";
import mongoose from "mongoose";
import {
  fetchUser,
  fetchUsers,
  sendOtp,
  updateUser,
  updateUserAdmin,
  uploadFile,
  verifyOtp,
} from "./route.js";
import { Server } from "socket.io";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND, process.env.FRONTEND_ADMIN],
    credentials: true,
  },
});

app.use(
  cors({
    origin: [process.env.FRONTEND, process.env.FRONTEND_ADMIN], // Next.js dev URL
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "public")));

chatServer(io);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("PostUser: MongoDB connected:"))
  .catch((err) => console.error("PostUser: MongoDB connection error:", err));

// POST route to store user data
app.post("/api/send-otp", sendOtp);
app.post("/api/verify-otp", verifyOtp);
app.post("/api/update-user", updateUser);
app.get("/api/admin/users", fetchUsers);
app.get("/api/admin/users/:userId", fetchUser);
app.post("/api/admin/update-user/:userId", updateUserAdmin);
app.post("/api/admin/uploadFile", upload.single("file"), uploadFile);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
