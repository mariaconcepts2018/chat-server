import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Message from './models/Message.js';
import cors from "cors";

dotenv.config();
const app = express();
const server = http.createServer(app);

const user = {};

app.use(cors({
  origin: [process.env.FRONTEND], // Next.js dev URL
  methods: ["GET", "POST"],
  credentials: true
}));

const io = new Server(server, {
    cors: {
    origin: [process.env.FRONTEND],
    methods: ["GET", "POST"],
    credentials: true
  }
});
const __dirname = path.resolve();

// ✅ Setup Socket.IO with CORS

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));



io.on('connection', async (socket) => {
  console.log('🟢 New client connected:', socket.id);

  socket.on('register', (userId) =>{
    user[userId] = socket.id;
    console.log('User registred', userId)

  })

    socket.on('adminChat', async ( msgData) =>{
          const newMsg = new Message(msgData);
    await newMsg.save();
    const targetId = msgData.sessionId;
    const targetSocket = user[targetId];
    if(targetSocket){
      io.to(targetSocket).emit('messageFromAdmin', msgData)
    }

  })


  // Send recent messages to client
  
  socket.on('loadUserMessages', async (userName)=>{
    const messages = await Message.find({sessionId : userName}).sort({ createdAt: -1 }).limit(50);

    socket.emit('chatHistory', messages);
  })

  // Listen for new messages
  socket.on('chatMessage', async (msgData) => {
    const newMsg = new Message(msgData);
    await newMsg.save();
    socket.emit('chatMessage', newMsg);
    io.emit("newMessageForAdmin", newMsg);
  });

    socket.on("loadAllChats", async () => {
    const allMsgs = await Message.find().sort({ createdAt: -1 });
    socket.emit("allChats", allMsgs);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
