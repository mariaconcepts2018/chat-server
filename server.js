import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from "cors";
import chat from "./chat.js"
import path from 'path';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();
const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [process.env.FRONTEND, process.env.FRONTEND_ADMIN], // Next.js dev URL
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));
chat(server);


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("PostUser: MongoDB connected:"))
  .catch((err) => console.error("PostUser: MongoDB connection error:", err));

// POST route to store user data
app.post("/api/users", async (req, res) => {
  
  try {
    const { name, phoneNumber, email } = req.body;

    if (!name || !phoneNumber || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newUser = new User({ name, phoneNumber, email });
    await newUser.save();

    res.status(201).json({ message: "User saved successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));