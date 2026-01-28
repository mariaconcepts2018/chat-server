import ChatRoom from "./models/ChatRoom.js";
import Message from "./models/Message.js";

export default function chatServer(io) {
  // ✅ Setup Socket.IO with CORS

  // Serve static frontend
  const joinedAdmins = new Map();

  const allAdminSockets = new Set();

  io.on("connection", async (socket) => {
    if (socket.admin) {
      allAdminSockets.add(socket.id);
    }
    socket.on("visitor:join", async ({ visitorId }) => {
      try {
        let room = await ChatRoom.findOne({ visitorId });
        if (!room) room = await ChatRoom.create({ visitorId });

        socket.join(room._id.toString());
        socket.emit("room:joined", room._id);
      } catch (error) {
        console.log(error);
      }
    });

    // Send recent messages to client

    socket.on("visitor:message", async ({ roomId, message }) => {
      if (message && message.length >= 8) {
        const roomOld = await ChatRoom.findById(roomId);

        if (roomOld.unreadCountForAdmin < 3) {
          const room = await ChatRoom.findByIdAndUpdate(
            roomId,
            {
              $inc: { unreadCountForAdmin: 1 },
              $set: { lastMessage: message },
            },
            { new: true },
          );
          const msg = await Message.create({
            roomId,
            sender: "visitor",
            message,
          });

          io.to(roomId).emit("message:new", msg);

          if (room.assignedAdminId) {
            joinedAdmins.get(roomId)?.forEach((adminSocketId) => {
              io.to(adminSocketId).emit("admin:chat:notify", {
                roomId,
                lastMessage: message,
                sender: "visitor",
                visitorId: room.visitorId,
                unreadCountForAdmin: room.unreadCountForAdmin,
              });
            });
          } else {
            // 4️⃣ Notify ALL admins (chat list / badge)
            allAdminSockets.forEach((adminSocketId) => {
              io.to(adminSocketId).emit("admin:chat:newMessage", {
                roomId,
                visitorId: room.visitorId,
                lastMessage: message,
                unreadCountForAdmin: room.unreadCountForAdmin,
              });
            });
          }
        }
      }
    });

    /* ADMIN */
    socket.on("admin:joinRoom", async ({ roomId, socketId }) => {
      if (!socket.admin) return;
      socket.join(roomId);
      const rid = String(roomId);

      if (!joinedAdmins.has(rid)) {
        joinedAdmins.set(rid, new Set());
      }
      joinedAdmins.get(rid).add(socketId);

      await ChatRoom.findByIdAndUpdate(roomId, {
        // unreadCountForAdmin: 0,
        assignedAdminId: socket.admin.id,
      });

      socket.to(roomId).emit("admin:joined", {
        adminName: socket.admin.name,
      });
    });

    socket.on("admin:leaveRoom", ({ roomId, socketId }) => {
      if (!socket.admin) return;

      socket.leave(roomId);
      joinedAdmins.get(roomId)?.delete(socketId);

      socket.to(roomId).emit("admin:left", {
        adminName: socket.admin.name,
      });
    });

    socket.on("admin:message", async ({ roomId, socketId, message }) => {
      if (!socket.admin) return;

      const rid = String(roomId);

      if (!joinedAdmins.get(rid)?.has(socketId)) return;

      const msg = await Message.create({
        roomId,
        sender: socket.admin.name,
        message,
      });

      io.to(roomId).emit("message:new", msg);

      const room = await ChatRoom.findByIdAndUpdate(roomId, {
        unreadCountForAdmin: 0,
        $set: { lastMessage: message },
      });

      io.emit("admin:chat:notify", {
        roomId,
        message: message,
        visitorId: room.visitorId,
        lastMessage: message,
        sender: socket.admin.name,
        unreadCountForAdmin: 0,
      });
    });

    socket.on("typing:start", ({ roomId, sender }) => {
      socket.to(roomId).emit("typing:start", { sender });
    });

    socket.on("typing:stop", ({ roomId, sender }) => {
      socket.to(roomId).emit("typing:stop", { sender });
    });

    socket.on("disconnect", () => {
      allAdminSockets.delete(socket.id);
      for (const admins of joinedAdmins.values()) {
        admins.delete(socket.id);
      }
    });
  });
}
