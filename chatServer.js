import ChatRoom from "./models/ChatRoom.js";
import Message from "./models/Message.js";

export default function chatServer(io) {
  // ✅ Setup Socket.IO with CORS

  // Serve static frontend
  const joinedAdmins = new Map();

  io.on("connection", async (socket) => {
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
      const msg = await Message.create({ roomId, sender: "visitor", message });

      const hasJoinedAdmins = joinedAdmins.get(roomId)?.size > 0;
      // 🔹 Send chat message ONLY to joined admins
      // if (hasJoinedAdmins) {
      io.to(roomId).emit("message:new", msg);
      // }
      const room = await ChatRoom.findByIdAndUpdate(
        roomId,
        hasJoinedAdmins
          ? { $set: { lastMessage: message } }
          : {
              $inc: { unreadCountForAdmin: 1 },
              $set: { lastMessage: message },
            },
        { new: true },
      );

      io.emit("admin:chat:notify", {
        roomId,
        lastMessage: message,
        sender: "visitor",
        visitorId: room.visitorId,
        unreadCountForAdmin: room.unreadCountForAdmin,
      });
    });

    /* ADMIN */
    socket.on("admin:joinRoom", async ({ roomId }) => {
      if (!socket.admin) return;
      socket.join(roomId);

      const rid = String(roomId);

      if (!joinedAdmins.has(rid)) {
        joinedAdmins.set(rid, new Set());
      }
      joinedAdmins.get(rid).add(socket.admin.id);

      await ChatRoom.findByIdAndUpdate(roomId, {
        unreadCountForAdmin: 0,
        assignedAdminId: socket.admin.id,
      });

      socket.to(roomId).emit("admin:joined", {
        adminName: socket.admin.name,
      });
    });

    socket.on("admin:leaveRoom", ({ roomId }) => {
      if (!socket.admin) return;

      socket.leave(roomId);
      joinedAdmins.get(roomId)?.delete(socket.id);

      socket.to(roomId).emit("admin:left", {
        adminName: socket.admin.name,
      });
    });

    socket.on("admin:message", async ({ roomId, message }) => {
      if (!socket.admin) return;

      const rid = String(roomId);
      if (!joinedAdmins.get(rid)?.has(socket.admin.id)) return;

      const msg = await Message.create({ roomId, sender: "admin", message });

      io.to(roomId).emit("message:new", msg);

      await ChatRoom.findByIdAndUpdate(roomId, {
        $set: { lastMessage: message },
      });

      io.emit("admin:chat:notify", {
        roomId,
        message: message,
        lastMessage: message,
        sender: "admin",
      });
    });

    socket.on("typing:start", ({ roomId, sender }) => {
      socket.to(roomId).emit("typing:start", { sender });
    });

    socket.on("typing:stop", ({ roomId, sender }) => {
      socket.to(roomId).emit("typing:stop", { sender });
    });

    socket.on("disconnect", () => {
      for (const [roomId, admins] of joinedAdmins) {
        admins.delete(socket.id);
        if (admins.size === 0) {
          joinedAdmins.delete(roomId);
        }
      }
    });
  });
}
