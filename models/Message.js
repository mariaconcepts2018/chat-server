import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    roomId: String,
    sender: String,
    message: String,
    isReadByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
