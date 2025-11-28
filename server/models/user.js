import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  occupation: { type: String },
  passwordHash: { type: String, required: true }, // store hash, not raw password
  details: { type: String }, // optional profile info
  isPremium: { type: Boolean, default: false },
  premiumType: { type: String, enum: ["monthly", "annually", "lifetime"], default: null },
  premiumSince: { type: Date },
  credits: { type: Number, default: 0 }, // e.g. for premium usage
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);