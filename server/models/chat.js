import mongoose from "mongoose";

export const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "bot"], required: true },
  content: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });


const ChatThreadSchema = new mongoose.Schema(
  {
    video: { type: String, required: true },
    title:{type:String, required:true},
    summary: { type: String },  
    futureIntegretion: { type: mongoose.Schema.Types.Mixed, default: {} },               
    messages: { type: [MessageSchema], default: [] },
    generatedPrompt: { type: String },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default ChatThreadSchema;