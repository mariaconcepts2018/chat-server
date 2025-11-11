import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  location: { type: String, required: true },
  leadSource: { type: String },
  service: { type: String },
  projectType: { type: String },
  houseType: { type: String },
  floors: { type: String },
  leadSource: { type: String },
  bhkType: { type: String },
  services: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.UserSchema || mongoose.model('User', UserSchema);