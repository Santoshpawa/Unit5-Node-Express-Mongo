// app.js
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// --- Database Connection ---
mongoose.connect("mongodb://127.0.0.1:27017/secureAuthSub", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// --- Schemas & Models ---
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["user", "admin"], default: "user" },
  subscription: {
    plan: { type: String, enum: ["free", "premium", "pro"], default: "free" },
    expiry: { type: Date, default: null },
  },
});

const tokenBlacklistSchema = new mongoose.Schema({
  token: String,
  expiry: Date,
});

const contentSchema = new mongoose.Schema({
  title: String,
  category: { type: String, enum: ["free", "premium"], default: "free" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const User = mongoose.model("User", userSchema);
const TokenBlacklist = mongoose.model("TokenBlacklist", tokenBlacklistSchema);
const Content = mongoose.model("Content", contentSchema);

// --- Helpers ---
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

// Check if token is blacklisted
const isTokenBlacklisted = async (token) => {
  const found = await TokenBlacklist.findOne({ token });
  return !!found;
};

// --- Middleware ---
const authMiddleware = (type = "access") => {
  return async (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ message: "Token required" });

    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ message: "Token blacklisted" });
    }

    try {
      const secret = type === "access" ? ACCESS_SECRET : REFRESH_SECRET;
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient rights" });
    }
    next();
  };
};

// --- Auth Routes ---
// Signup
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed, role });
    await user.save();
    res.json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Invalid credentials" });

  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ accessToken, refreshToken });
});

// Logout
app.post("/logout", async (req, res) => {
  const { accessToken, refreshToken } = req.body;
  if (accessToken)
    await new TokenBlacklist({
      token: accessToken,
      expiry: new Date(Date.now() + 15 * 60 * 1000),
    }).save();
  if (refreshToken)
    await new TokenBlacklist({
      token: refreshToken,
      expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }).save();
  res.json({ message: "Logged out successfully" });
});

// Refresh token
app.post("/refresh", authMiddleware("refresh"), async (req, res) => {
  const user = req.user;
  const newAccessToken = jwt.sign(
    { id: user.id, role: user.role },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  res.json({ accessToken: newAccessToken });
});

// --- Subscription Routes ---
app.post("/subscribe", authMiddleware(), async (req, res) => {
  const { plan } = req.body;
  const user = await User.findById(req.user.id);

  user.subscription.plan = plan;
  user.subscription.expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();

  res.json({ message: `Subscribed to ${plan}`, subscription: user.subscription });
});

app.get("/subscription-status", authMiddleware(), async (req, res) => {
  const user = await User.findById(req.user.id);

  // Auto-downgrade if expired
  if (user.subscription.expiry && new Date() > user.subscription.expiry) {
    user.subscription.plan = "free";
    user.subscription.expiry = null;
    await user.save();
  }

  res.json({ subscription: user.subscription });
});

app.patch("/renew", authMiddleware(), async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user.subscription.expiry)
    return res.status(400).json({ message: "No active subscription" });

  if (new Date() < user.subscription.expiry) {
    user.subscription.expiry = new Date(
      user.subscription.expiry.getTime() + 30 * 24 * 60 * 60 * 1000
    );
  } else {
    return res.status(400).json({ message: "Subscription expired, buy again" });
  }

  await user.save();
  res.json({ message: "Subscription renewed", subscription: user.subscription });
});

app.post("/cancel-subscription", authMiddleware(), async (req, res) => {
  const user = await User.findById(req.user.id);
  user.subscription.plan = "free";
  user.subscription.expiry = null;
  await user.save();
  res.json({ message: "Subscription canceled" });
});

// --- Content Routes ---
app.get("/content/free", authMiddleware(), async (req, res) => {
  const content = await Content.find({ category: "free" });
  res.json(content);
});

app.get("/content/premium", authMiddleware(), async (req, res) => {
  const user = await User.findById(req.user.id);
  if (["premium", "pro"].includes(user.subscription.plan)) {
    const content = await Content.find({});
    res.json(content);
  } else {
    res.status(403).json({ message: "Upgrade subscription to access premium" });
  }
});

app.post(
  "/content",
  authMiddleware(),
  roleMiddleware(["admin"]),
  async (req, res) => {
    const { title, category } = req.body;
    const content = new Content({
      title,
      category,
      createdBy: req.user.id,
    });
    await content.save();
    res.json({ message: "Content created", content });
  }
);

app.delete(
  "/content/:id",
  authMiddleware(),
  roleMiddleware(["admin"]),
  async (req, res) => {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ message: "Content deleted" });
  }
);

// --- Start Server ---
app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});
