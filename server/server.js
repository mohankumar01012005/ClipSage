// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./dbconnection/dbconnection.js"; // keep your existing DB connection
import aiVideoSummaryRoutes from "./routes/aivideoSummary.js";
import authRoutes from "./routes/auth.js";
import razorrouter from "./routes/razorpay.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5005
connectDB();
// Auth routes
app.use("/api/auth", authRoutes);
app.use("/api/video", aiVideoSummaryRoutes);
app.use("/api/pay", razorrouter);

app.get("/", (req, res) => {
  res.send("Server is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
