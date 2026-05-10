const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("DB Connection Error:", err));

/* Schema & Model
   Data 30 min baad automatically delete ho jayega
*/
const ShareSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800, // 30 minutes
  },
});

const Share = mongoose.model("Share", ShareSchema);

// Home Route
app.get("/", async (req, res) => {
  try {
    // Vercel par IP headers se milti hai
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const data = await Share.findOne({ ip });

    res.json(data || { text: "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Save Route
app.post("/save", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const { text } = req.body;

    const updated = await Share.findOneAndUpdate(
      { ip },
      {
        text,
        createdAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Save Error" });
  }
});

// Server
module.exports = app;