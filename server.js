require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const uri = process.env.MONGODB_URI;

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  scores: [
    {
      title: { type: String, required: true },
      score: { type: Number, required: true },
    },
  ],
});

const User = mongoose.model("User", userSchema);

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUserByName = await User.findOne({ name });
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByName || existingUserByEmail) {
      return res.status(400).json({ error: "User already exists" });
    }
    const newUser = new User({ name, email, password, scores: [] });
    await newUser.save();
    res.status(200).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && user.password === password) {
      if (user.scores.length === 0) {
        return res.status(200).json({ message: "Login successful" });
      } else {
        return res.status(403).json({ error: "You have already taken the test" });
      }
    } else {
      return res.status(400).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/submit", async (req, res) => {
  const { email, scores } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      user.scores = scores;
      await user.save();
      res.status(200).json({ message: "Score submitted" });
    } else {
      res.status(400).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error during score submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, { name: 1, email: 1, password: 1, scores: 1, _id: 1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/userDelete/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5000;
