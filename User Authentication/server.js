// app.js
// Single-file Node.js app with signup, login, forgot-password, reset-password
// Usage:
//   npm init -y
//   npm install express bcrypt jsonwebtoken nodemailer uuid helmet body-parser
//   node app.js
//
// Environment variables (optional):
//   PORT - default 3000
//   JWT_SECRET - secret for access tokens
//   RESET_JWT_SECRET - secret for password reset tokens
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS - to use real SMTP
//
// If no SMTP config provided it will create an Ethereal test account (nodemailer) and log preview URLs.

const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const helmet = require("helmet");

const app = express();
app.use(helmet());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_access_secret";
const RESET_JWT_SECRET = process.env.RESET_JWT_SECRET || "change_this_reset_secret";
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "1h";
const RESET_TOKEN_EXPIRES_IN = process.env.RESET_TOKEN_EXPIRES_IN || "15m"; // recommended 15-30m
const BCRYPT_SALT_ROUNDS = 10;

// ---- In-memory "DB" (for demo). Replace with real DB in production ----
const users = new Map(); // key: email -> { id, name, email, passwordHash, createdAt }
const usedResetJtis = new Set(); // store used reset token jti to prevent reuse

// ---- Simple in-memory rate limiter for forgot-password (per email/ip) ----
const forgotRate = new Map(); // key: keyString -> { count, firstRequestAt }
const FORGOT_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const FORGOT_MAX_REQUESTS = 5; // max requests per window

function hitForgotRate(key) {
  const now = Date.now();
  const rec = forgotRate.get(key);
  if (!rec) {
    forgotRate.set(key, { count: 1, firstRequestAt: now });
    return true;
  }
  if (now - rec.firstRequestAt > FORGOT_LIMIT_WINDOW_MS) {
    // reset
    forgotRate.set(key, { count: 1, firstRequestAt: now });
    return true;
  }
  if (rec.count >= FORGOT_MAX_REQUESTS) return false;
  rec.count++;
  return true;
}

// ---- Nodemailer setup (supports real SMTP via env or Ethereal test account) ----
let transporterPromise = (async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // real SMTP from env
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("Using SMTP from environment variables.");
    return t;
  } else {
    // create test account
    const testAccount = await nodemailer.createTestAccount();
    const t = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("No SMTP env found — using Ethereal test account. Preview URLs will be logged.");
    return t;
  }
})();

// ---- Utility functions ----
function generateAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function generateResetToken(email) {
  // include a jti to allow single-use invalidation
  const jti = uuidv4();
  const token = jwt.sign({ email, jti }, RESET_JWT_SECRET, { expiresIn: RESET_TOKEN_EXPIRES_IN });
  return { token, jti };
}

function verifyResetToken(token) {
  try {
    const payload = jwt.verify(token, RESET_JWT_SECRET);
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: err };
  }
}

// ---- Routes ----

// Health check
app.get("/", (req, res) => {
  res.send({ ok: true, timestamp: Date.now() });
});

// Signup
// POST /signup
// body: { name, email, password }
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, password required" });
    }
    const normalizedEmail = String(email).toLowerCase();
    if (users.has(normalizedEmail)) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = {
      id: uuidv4(),
      name,
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    users.set(normalizedEmail, user);
    return res.status(201).json({ message: "User created", user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Login
// POST /login
// body: { email, password }
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email, password required" });
    const normalizedEmail = String(email).toLowerCase();
    const user = users.get(normalizedEmail);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });
    const accessToken = generateAccessToken(user);
    return res.json({ accessToken, expiresIn: ACCESS_TOKEN_EXPIRES_IN });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Forgot password
// POST /forgot-password
// body: { email }
// IMPORTANT: Do NOT reveal if email exists; always respond with generic message.
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "email required" });

    // rate-limit by IP + email to reduce abuse
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const key = `${ip}:${String(email).toLowerCase()}`;
    if (!hitForgotRate(key)) {
      // Generic response to avoid giving hints
      return res.status(429).json({ message: "If this email is registered, you will receive password reset instructions shortly." });
    }

    const normalizedEmail = String(email).toLowerCase();
    const maybeUser = users.get(normalizedEmail);

    // Always respond the same; but only send email if user exists.
    const genericResponse = { message: "If this email is registered, you will receive password reset instructions shortly." };

    if (!maybeUser) {
      // don't indicate non-existence
      return res.json(genericResponse);
    }

    // generate reset token
    const { token, jti } = generateResetToken(normalizedEmail);

    // produce a reset link — in real app this should be your frontend route
    // e.g. https://your-frontend.com/reset-password/<token>
    // for demo we'll point to backend endpoint so you can POST to it directly:
    const resetLink = `${req.protocol}://${req.get("host")}/reset-password/${token}`;

    const transporter = await transporterPromise;
    const mailOptions = {
      from: `"No-Reply" <no-reply@example.com>`,
      to: normalizedEmail,
      subject: "Password reset request",
      text: `You (or someone else) requested a password reset. Click the link to reset your password. If you didn't request this, ignore this email.\n\nReset link (valid for ${RESET_TOKEN_EXPIRES_IN}):\n\n${resetLink}\n\n`,
      html: `<p>You (or someone else) requested a password reset. Click the link to reset your password. If you didn't request this, ignore this email.</p>
             <p>Reset link (valid for ${RESET_TOKEN_EXPIRES_IN}): <a href="${resetLink}">${resetLink}</a></p>`,
    };

    const info = await transporter.sendMail(mailOptions);

    // If using Ethereal, log preview URL
    if (nodemailer.getTestMessageUrl && info) {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        console.log("Preview URL: %s", preview);
      }
    }

    // Optionally: store the current jti somewhere (if you want to restrict to latest token per user)
    // In this example we rely on usedResetJtis to prevent reuse; you may also want to store active jtIs per user and expire them on new requests.

    return res.json(genericResponse);
  } catch (err) {
    console.error("forgot-password error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Reset password
// POST /reset-password/:token
// body: { password }
// Verifies token, checks not used, updates password
app.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params || {};
    const { password } = req.body || {};
    if (!token) return res.status(400).json({ error: "token required" });
    if (!password) return res.status(400).json({ error: "new password required" });

    const { valid, payload, error } = verifyResetToken(token);
    if (!valid) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const { email, jti } = payload;
    if (!email || !jti) return res.status(400).json({ error: "Invalid token payload" });

    // check token reuse
    if (usedResetJtis.has(jti)) {
      return res.status(400).json({ error: "This reset link has already been used" });
    }

    const user = users.get(String(email).toLowerCase());
    if (!user) {
      // Rare case: user removed after token issuance. For security, respond with generic message.
      return res.status(400).json({ error: "Invalid token" });
    }

    // update hashed password
    const newHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    user.passwordHash = newHash;

    // mark jti as used
    usedResetJtis.add(jti);

    // (Optional) Invalidate other sessions / tokens — not implemented in this simple demo.

    return res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Example protected route (requires Authorization: Bearer <token>)
app.get("/me", (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    const token = auth.slice("Bearer ".length);
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }
    // find user
    let user = null;
    for (const u of users.values()) {
      if (u.id === payload.sub) {
        user = u;
        break;
      }
    }
    if (!user) return res.status(401).json({ error: "User not found" });
    return res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Start server after transporter ready
transporterPromise
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log("Available endpoints:");
      console.log("POST /signup       { name, email, password }");
      console.log("POST /login        { email, password }");
      console.log("POST /forgot-password { email }");
      console.log("POST /reset-password/:token { password }");
      console.log("GET  /me (protected, Authorization: Bearer <token>)");
    });
  })
  .catch((err) => {
    console.error("Failed to initialize transporter:", err);
    process.exit(1);
  });
