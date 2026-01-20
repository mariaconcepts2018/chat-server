import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema(
  {
    visitorId: { type: String, unique: true },
    assignedadminId: String,
    lastMessage: String,
    unreadCountForAdmin: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.models.ChatRoom ||
  mongoose.model("ChatRoom", ChatRoomSchema);
