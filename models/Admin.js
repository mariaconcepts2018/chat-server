// models/Admin.model.js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    email: { type: String, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
    refreshToken: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("Admin", adminSchema);
