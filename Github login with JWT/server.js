// app.js
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
app.use(express.json());

// --- MongoDB Connection ---
mongoose.connect("mongodb://127.0.0.1:27017/githubLogin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// --- User Schema ---
const userSchema = new mongoose.Schema({
  githubId: { type: String, unique: true },
  username: String,
  email: String,
});

const User = mongoose.model("User", userSchema);

// --- GitHub OAuth Config ---
const CLIENT_ID = "YOUR_GITHUB_CLIENT_ID";
const CLIENT_SECRET = "YOUR_GITHUB_CLIENT_SECRET";
const JWT_SECRET = "supersecret"; // ⚠️ put in .env in real apps

// --- Routes ---
// Step 1: Redirect user to GitHub login
app.get("/auth/github", (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=user:email`;
  res.redirect(redirectUrl);
});

// Step 2: GitHub redirects back with code -> Exchange code for access token
app.get("/auth/github/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ message: "Code not provided" });

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch user profile
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${accessToken}` },
    });

    const emailResponse = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `token ${accessToken}` },
    });

    const githubProfile = userResponse.data;
    const primaryEmail =
      emailResponse.data.find((e) => e.primary && e.verified)?.email || null;

    // Save user in DB if not exists
    let user = await User.findOne({ githubId: githubProfile.id });
    if (!user) {
      user = new User({
        githubId: githubProfile.id,
        username: githubProfile.login,
        email: primaryEmail,
      });
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, githubId: user.githubId, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected Route Example
app.get("/profile", async (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Token required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// --- Start Server ---
app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
  console.log("👉 Visit http://localhost:5000/auth/github to login with GitHub");
});
