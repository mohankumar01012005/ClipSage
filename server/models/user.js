import mongoose from "mongoose";
import ChatThreadSchema from "./chat.js"
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, index: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    occupation: { type: String },
    passwordHash: { type: String, required: true },
    details: { type: String },
    isPremium: { type: Boolean, default: false },
    premiumType: { type: String, enum: ["monthly", "annually", "lifetime"], default: null },
    premiumSince: { type: Date },
    credits: { type: Number, default: 0 },
    userChats: [ChatThreadSchema]   // embedded chat threads
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);