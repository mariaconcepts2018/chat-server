import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Message from './models/Message.js';

const chat = (server) => {
    // ✅ Setup Socket.IO with CORS
const user = {};
const io = new Server(server, {
    cors: {
    origin: [process.env.FRONTEND],
    methods: ["GET", "POST"],
    credentials: true
  }
});
// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Serve static frontend



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

}

export default chat;