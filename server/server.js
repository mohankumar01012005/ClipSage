import express from "express";
import cors from "cors";
import connectDB from "./dbconnection/dbconnection.js";
const app = express();
const PORT = 5005;


app.use(cors());
app.use(express.json());
connectDB();


app.get("/", (req, res) => {
  res.send("Server is running on port 5005 🚀");
});


app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
