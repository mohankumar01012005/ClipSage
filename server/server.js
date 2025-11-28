import express from "express";
import cors from "cors";

const app = express();
const PORT = 5005;


app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Server is running on port 5005 🚀");
});


app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
