/**
 * app.js - Notes App API with Authentication
 *
 * Run:
 * 1. npm init -y
 * 2. npm i express mongoose bcrypt jsonwebtoken dotenv
 * 3. node app.js
 *
 * Environment variables (optional):
 * - MONGODB_URI (default: mongodb://127.0.0.1:27017/notes_db)
 * - JWT_SECRET (default: 'supersecret')
 * - PORT (default: 3000)
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// ---- Config ----
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notes_db';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const PORT = process.env.PORT || 3000;

// ---- Schemas ----
const { Schema } = mongoose;

const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  password: String // hashed password
});

const noteSchema = new Schema({
  title: String,
  content: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', userSchema);
const Note = mongoose.model('Note', noteSchema);

// ---- Connect DB ----
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ---- Helper: JWT ----
function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '12h' });
}

// ---- Middleware: Auth ----
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ message: 'Token missing' });

    const payload = jwt.verify(match[1], JWT_SECRET);
    req.user = payload; // {id, email}
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
}

// ---- Auth Routes ----

// POST /signup
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({ message: 'User created', user: { id: user._id, name, email }, token });
  } catch (err) {
    res.status(500).json({ message: 'Signup error', error: err.message });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'All fields required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

// ---- Notes Routes (Protected) ----

// POST /notes
app.post('/notes', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });

    const note = new Note({ title, content, createdBy: req.user.id });
    await note.save();
    res.status(201).json({ message: 'Note created', note });
  } catch (err) {
    res.status(500).json({ message: 'Create note error', error: err.message });
  }
});

// GET /notes
app.get('/notes', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ createdBy: req.user.id });
    res.json({ count: notes.length, notes });
  } catch (err) {
    res.status(500).json({ message: 'Fetch notes error', error: err.message });
  }
});

// PUT /notes/:id
app.put('/notes/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const { title, content } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    await note.save();

    res.json({ message: 'Note updated', note });
  } catch (err) {
    res.status(500).json({ message: 'Update note error', error: err.message });
  }
});

// DELETE /notes/:id
app.delete('/notes/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    await note.remove();
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete note error', error: err.message });
  }
});

// ---- Default Route ----
app.get('/', (req, res) => {
  res.send('Notes App API is running. Use /signup, /login, /notes');
});

// ---- Start ----
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
