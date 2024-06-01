require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

const uri = process.env.MONGODB_URI;

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  score: { type: Number, default: 0 },
});

const User = mongoose.model('User', userSchema);

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUserByName = await User.findOne({ name });
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByName || existingUserByEmail) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const newUser = new User({ name, email, password });
    await newUser.save();
    res.status(200).json({ message: 'Signup successful' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && user.password === password) {
      if (user.score == 0) {
        return res.status(200).json({ message : 'Login successful ' });
      } else if (user.score !== 0) {
        return res.status(403).json({ error: 'You have already taken the test' });
      }
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/submit', async (req, res) => {
  const { email, score } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      user.score = score;
      await user.save();
      res.status(200).json({ message: 'Score submitted' });
    } else {
      res.status(400).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error during score submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { name: 1, email: 1, password: 1, score: 1, _id: 0 });

    const numberedUsers = users.map((user, index) => ({
      number: index + 1,
      name: user.name,
      email: user.email,
      password: user.password,
      score: user.score,
    }));

    res.status(200).json(numberedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
