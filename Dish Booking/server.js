// app.js
// Dish Booking System (single-file demo)
// Features:
// - Signup / Login (bcrypt + JWT)
// - Roles: admin, user, chef
// - Admin CRUD dishes
// - Users place orders (auto assign random chef; status flows)
// - Chefs update order statuses
// - Forgot password -> reset link via email (Ethereal if no SMTP env provided)
// - Swagger docs at /api-docs
//
// Usage:
//   npm install express bcrypt jsonwebtoken nodemailer uuid helmet swagger-ui-express swagger-jsdoc
//   node app.js
//
// Env (optional):
//   PORT, JWT_SECRET, RESET_JWT_SECRET, SMTP_*

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(helmet());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_access";
const RESET_JWT_SECRET = process.env.RESET_JWT_SECRET || "super_secret_reset";
const ACCESS_TOKEN_EXPIRES_IN = "2h";
const RESET_TOKEN_EXPIRES_IN = "20m";
const BCRYPT_SALT_ROUNDS = 10;

// ---- In-memory "DB" (demo). Replace with real DB in production. ----
const users = new Map();   // email -> { id, name, email, passwordHash, role }
const dishes = new Map();  // dishId -> { id, name, price, description, createdBy }
const orders = new Map();  // orderId -> { id, userId, dishId, qty, status, chefId, createdAt }

// For single-use reset tokens
const usedResetJtis = new Set();

// ---- Nodemailer setup (Ethereal fallback) ----
let transporterPromise = (async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("Using SMTP from environment.");
    return t;
  } else {
    const testAccount = await nodemailer.createTestAccount();
    const t = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("No SMTP env found. Using Ethereal test account. Preview URLs will be logged.");
    return t;
  }
})();

// ---- Helpers ----
function generateAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}
function generateResetToken(email) {
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
function authenticateMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, email, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== role && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}
function pickRandomChef() {
  const chefList = Array.from(users.values()).filter(u => u.role === "chef");
  if (chefList.length === 0) return null;
  return chefList[Math.floor(Math.random() * chefList.length)];
}

// ---- Seed an admin user for convenience ----
(async function seedAdmin() {
  const adminEmail = "admin@example.com";
  if (!users.has(adminEmail)) {
    const hash = await bcrypt.hash("adminpass", BCRYPT_SALT_ROUNDS);
    users.set(adminEmail, { id: uuidv4(), name: "Admin", email: adminEmail, passwordHash: hash, role: "admin" });
    console.log("Seeded admin: admin@example.com / adminpass");
  }
})();

// ---- Routes ----

/**
 * @swagger
 * tags:
 *   - name: Auth
 *   - name: Dishes
 *   - name: Orders
 */

// Health
app.get("/", (req, res) => res.json({ ok: true, timestamp: Date.now() }));

// Signup
// POST /signup { name, email, password, role? } roles: user (default), chef, admin (only allowed if secret? but we'll allow for testing)
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
    const normalized = String(email).toLowerCase();
    if (users.has(normalized)) return res.status(409).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = { id: uuidv4(), name, email: normalized, passwordHash: hash, role: role || "user" };
    users.set(normalized, user);
    return res.status(201).json({ message: "User created", user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Login
// POST /login { email, password }
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email, password required" });
    const normalized = String(email).toLowerCase();
    const user = users.get(normalized);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = generateAccessToken(user);
    return res.json({ accessToken: token, expiresIn: ACCESS_TOKEN_EXPIRES_IN, role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

//
// Dishes - Admin only for create/update/delete. Everyone can list & view
//

// GET /dishes
app.get("/dishes", (req, res) => {
  const all = Array.from(dishes.values());
  res.json(all);
});

// GET /dishes/:id
app.get("/dishes/:id", (req, res) => {
  const d = dishes.get(req.params.id);
  if (!d) return res.status(404).json({ error: "Dish not found" });
  return res.json(d);
});

// POST /dishes (admin)
app.post("/dishes", authenticateMiddleware, requireRole("admin"), (req, res) => {
  const { name, price, description } = req.body || {};
  if (!name || typeof price !== "number") return res.status(400).json({ error: "name and numeric price required" });
  const id = uuidv4();
  const dish = { id, name, price, description: description || "", createdBy: req.user.sub, createdAt: new Date().toISOString() };
  dishes.set(id, dish);
  return res.status(201).json(dish);
});

// PUT /dishes/:id (admin)
app.put("/dishes/:id", authenticateMiddleware, requireRole("admin"), (req, res) => {
  const existing = dishes.get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Dish not found" });
  const { name, price, description } = req.body || {};
  if (name) existing.name = name;
  if (typeof price === "number") existing.price = price;
  if (description !== undefined) existing.description = description;
  dishes.set(existing.id, existing);
  return res.json(existing);
});

// DELETE /dishes/:id (admin)
app.delete("/dishes/:id", authenticateMiddleware, requireRole("admin"), (req, res) => {
  const existed = dishes.delete(req.params.id);
  if (!existed) return res.status(404).json({ error: "Dish not found" });
  return res.json({ message: "Dish deleted" });
});

//
// Orders
//

// POST /orders (user places order) body { dishId, qty }
// Auto-assign random chef. status: "Order Received"
app.post("/orders", authenticateMiddleware, (req, res) => {
  const userId = req.user.sub;
  const userRole = req.user.role;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (userRole !== "user" && userRole !== "admin") {
    // chefs shouldn't place user orders via this endpoint
    return res.status(403).json({ error: "Only users (or admin on behalf) can place orders" });
  }
  const { dishId, qty } = req.body || {};
  if (!dishId || !qty) return res.status(400).json({ error: "dishId and qty required" });
  const dish = dishes.get(dishId);
  if (!dish) return res.status(404).json({ error: "Dish not found" });
  const chef = pickRandomChef();
  const chefId = chef ? chef.id : null;
  const order = {
    id: uuidv4(),
    userId,
    dishId,
    qty,
    status: "Order Received",
    chefId,
    createdAt: new Date().toISOString(),
  };
  orders.set(order.id, order);
  return res.status(201).json(order);
});

// GET /orders
// - admin: all orders
// - chef: orders assigned to them
// - user: their own orders
app.get("/orders", authenticateMiddleware, (req, res) => {
  const role = req.user.role;
  const uid = req.user.sub;
  let list = Array.from(orders.values());
  if (role === "admin") {
    // all
  } else if (role === "chef") {
    list = list.filter(o => o.chefId === uid);
  } else {
    list = list.filter(o => o.userId === uid);
  }
  return res.json(list);
});

// GET /orders/:id
app.get("/orders/:id", authenticateMiddleware, (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const role = req.user.role;
  const uid = req.user.sub;
  if (role === "admin" || (role === "chef" && order.chefId === uid) || (order.userId === uid)) {
    return res.json(order);
  }
  return res.status(403).json({ error: "Forbidden" });
});

// PUT /orders/:id/status  { status }
// Only assigned chef (or admin) can update status
app.put("/orders/:id/status", authenticateMiddleware, (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const role = req.user.role;
  const uid = req.user.sub;
  if (!(role === "admin" || (role === "chef" && order.chefId === uid))) {
    return res.status(403).json({ error: "Forbidden: not allowed to update this order" });
  }
  const { status } = req.body || {};
  const validStatuses = ["Order Received", "Preparing", "Out for Delivery", "Delivered"];
  if (!status || !validStatuses.includes(status)) return res.status(400).json({ error: `status required; valid: ${validStatuses.join(", ")}` });
  order.status = status;
  orders.set(order.id, order);
  return res.json(order);
});

//
// Password reset (forgot -> email, reset -> update password)
//

// POST /forgot-password { email } -> generic response, sends email if account exists
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "email required" });

    const normalized = String(email).toLowerCase();
    const generic = { message: "If this email is registered, you will receive password reset instructions." };

    const user = users.get(normalized);
    if (!user) return res.json(generic);

    const { token, jti } = generateResetToken(normalized);
    const resetLink = `${req.protocol}://${req.get("host")}/reset-password/${token}`;

    const transporter = await transporterPromise;
    const mail = {
      from: `"No-Reply" <no-reply@example.com>`,
      to: normalized,
      subject: "Password reset - Dish Booking System",
      text: `Reset link (valid ~${RESET_TOKEN_EXPIRES_IN}):\n\n${resetLink}`,
      html: `<p>Reset link (valid ~${RESET_TOKEN_EXPIRES_IN}): <a href="${resetLink}">${resetLink}</a></p>`,
    };
    const info = await transporter.sendMail(mail);
    if (nodemailer.getTestMessageUrl && info) {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log("Password reset email preview:", preview);
    }

    // In production you may store active jtis per user; here we only track used ones on redeem.
    return res.json(generic);
  } catch (err) {
    console.error("forgot-password err", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /reset-password/:token { password }
app.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params || {};
    const { password } = req.body || {};
    if (!token) return res.status(400).json({ error: "token required" });
    if (!password) return res.status(400).json({ error: "new password required" });

    const { valid, payload, error } = verifyResetToken(token);
    if (!valid) return res.status(400).json({ error: "Invalid or expired token" });

    const { email, jti } = payload;
    if (!email || !jti) return res.status(400).json({ error: "Invalid token payload" });
    if (usedResetJtis.has(jti)) return res.status(400).json({ error: "This reset link has already been used" });

    const user = users.get(String(email).toLowerCase());
    if (!user) return res.status(400).json({ error: "Invalid token" });

    const newHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    user.passwordHash = newHash;
    usedResetJtis.add(jti);

    // Could also invalidate existing access tokens (not implemented here)
    return res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("reset-password err", err);
    return res.status(500).json({ error: "Server error" });
  }
});

//
// Simple protected profile route
//
app.get("/me", authenticateMiddleware, (req, res) => {
  const uid = req.user.sub;
  const user = Array.from(users.values()).find(u => u.id === uid);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// ---- Swagger Setup ----
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Dish Booking System API",
      version: "1.0.0",
      description: "Demo Dish Booking System with multi-role access and password reset",
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: [__filename], // use JSDoc in this file
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Add a few manual swagger paths (since full JSDoc for every endpoint would be long)
swaggerSpec.paths = swaggerSpec.paths || {};
swaggerSpec.paths["/signup"] = {
  post: {
    tags: ["Auth"],
    summary: "Create a new user",
    requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, password: { type: "string" }, role: { type: "string" } }, required: ["name", "email", "password"] } } } },
    responses: { "201": { description: "User created" } }
  }
};
swaggerSpec.paths["/login"] = {
  post: {
    tags: ["Auth"], summary: "Login", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, required: ["email", "password"] } } } }, responses: { "200": { description: "accessToken" } }
  }
};
swaggerSpec.paths["/dishes"] = {
  get: {
    tags: ["Dishes"], summary: "List dishes", responses: { "200": { description: "Array of dishes" } }
  },
  post: {
    tags: ["Dishes"], summary: "Create dish (admin)", security: [{ bearerAuth: [] }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, price: { type: "number" }, description: { type: "string" } }, required: ["name", "price"] } } } }, responses: { "201": { description: "Created" } }
  }
};
swaggerSpec.paths["/orders"] = {
  post: {
    tags: ["Orders"], summary: "Place order (user)", security: [{ bearerAuth: [] }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { dishId: { type: "string" }, qty: { type: "number" } }, required: ["dishId", "qty"] } } } }, responses: { "201": { description: "Order placed" } }
  },
  get: { tags: ["Orders"], summary: "List orders (role-based)", security: [{ bearerAuth: [] }], responses: { "200": { description: "Orders list" } } }
};
// security scheme
swaggerSpec.components = swaggerSpec.components || {};
swaggerSpec.components.securitySchemes = {
  bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---- Start server ----
transporterPromise
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Dish Booking System listening at http://localhost:${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
      console.log("Seeded admin login: admin@example.com / adminpass");
    });
  })
  .catch(err => {
    console.error("Failed to init transporter", err);
    process.exit(1);
  });

