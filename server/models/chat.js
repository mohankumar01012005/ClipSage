import mongoose from "mongoose";

export const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "bot"], required: true },
  content: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });


const PromptFlowSchema = new mongoose.Schema({
  name: { type: String },           
  steps: [{ type: String }]
}, { _id: false });

const ChatThreadSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true, index: true },
  summary: { type: String },
  messages: { type: [MessageSchema], default: [] },
  generatedPrompt: { type: String },
  promptFlows: { type: [PromptFlowSchema], default: [] },
  isPinned: { type: Boolean, default: false },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });


export default mongoose.model("ChatThread", ChatThreadSchema);