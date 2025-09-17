require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blogs_db';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key';
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

// ---------- Mongoose Schemas & Models ----------
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true } // hashed
});

const blogSchema = new Schema({
  title: { type: String, required: true },
  content: String,
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const User = mongoose.model('User', userSchema);
const Blog = mongoose.model('Blog', blogSchema);

// ---------- Connect to MongoDB ----------
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ---------- Helper: generate JWT ----------
function generateToken(user) {
  // We store id and email in token payload
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '12h' });
}

// ---------- Auth Middleware ----------
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ message: 'Authorization token missing' });

    const token = match[1];
    const payload = jwt.verify(token, JWT_SECRET);
    // Attach minimal user info to req. For safety fetch fresh user from DB (optional).
    const user = await User.findById(payload.id).select('_id name email');
    if (!user) return res.status(401).json({ message: 'Invalid token (user not found)' });

    req.user = { id: user._id.toString(), name: user.name, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
}

// ---------- Routes ----------

// POST /signup - register new user (hash password)
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password required' });

    // check existing
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({ name, email, password: hashed });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({ message: 'User created', user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /login - authenticate and return JWT
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ---------- Blog CRUD (protected) ----------

// POST /blogs - create new blog
app.post('/blogs', authMiddleware, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });

    const blog = new Blog({
      title,
      content: content || '',
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      createdBy: req.user.id
    });
    await blog.save();

    res.status(201).json({ message: 'Blog created', blog });
  } catch (err) {
    console.error('Create blog error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /blogs - fetch all blogs created by logged-in user
app.get('/blogs', authMiddleware, async (req, res) => {
  try {
    const blogs = await Blog.find({ createdBy: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ count: blogs.length, blogs });
  } catch (err) {
    console.error('Get blogs error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /blogs/:id - update a blog if it belongs to logged-in user
app.put('/blogs/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (blog.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden: not your blog' });

    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (tags !== undefined) blog.tags = Array.isArray(tags) ? tags : [tags];

    await blog.save();
    res.json({ message: 'Blog updated', blog });
  } catch (err) {
    console.error('Update blog error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /blogs/:id - delete a blog if it belongs to logged-in user
app.delete('/blogs/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (blog.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden: not your blog' });

    await blog.remove();
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    console.error('Delete blog error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /blogs/:id - get a single blog (optional, protected)
app.get('/blogs/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id).populate('createdBy', 'name email');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    // if you want to restrict read to owner only uncomment below:
    // if (blog.createdBy._id.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    res.json({ blog });
  } catch (err) {
    console.error('Get blog error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ---------- Aggregation: GET /blogs/stats ----------
/**
 * Returns:
 *  - totalBlogs: total number of blog documents
 *  - blogsPerUser: [{userId, name, email, count}]
 *  - topTags: [{tag, count}] (top 10)
 */
app.get('/blogs/stats', authMiddleware, async (req, res) => {
  try {
    // We'll use aggregation with facets to compute multiple stats in one DB call
    const facets = await Blog.aggregate([
      {
        $facet: {
          totalBlogs: [{ $count: 'count' }],
          blogsPerUser: [
            { $group: { _id: '$createdBy', count: { $sum: 1 } } },
            // lookup user to get name and email
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                userId: '$_id',
                name: '$user.name',
                email: '$user.email',
                count: 1
              }
            },
            { $sort: { count: -1 } }
          ],
          topTags: [
            { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $project: { _id: 0, tag: '$_id', count: 1 } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    const result = facets[0] || {};
    const totalBlogs = (result.totalBlogs && result.totalBlogs[0] && result.totalBlogs[0].count) || 0;

    res.json({
      totalBlogs,
      blogsPerUser: result.blogsPerUser || [],
      topTags: result.topTags || []
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ---------- Default route ----------
app.get('/', (req, res) => {
  res.send('Blog Management API is running. See /signup, /login, /blogs, /blogs/stats');
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});