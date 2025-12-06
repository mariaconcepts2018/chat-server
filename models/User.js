import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  location: { type: String, required: true },
  leadSource: { type: String, required: true },
  company: { type: String, required: true },
  service: { type: String },
  houseType: { type: String },
  floors: { type: String },
  bhkType: { type: String },
  services: { type: String },
  createdAt: { type: Date, default: Date.now },
  leadStatus: { type: String, default: "open" },
  appointmentDate: { type: Date },
  notes: { type: String },
  modifiedBy: { type: String },
  modifiedOn: { type: Date },
});

UserSchema.index({ company: 1, phone: 1 }, { unique: true });

export default mongoose.models.UserSchema || mongoose.model("User", UserSchema);
