// app.js
// Single-file Books API with Redis caching + cron bulk insertion
//
// Run:
//   npm install express ioredis bcrypt jsonwebtoken helmet uuid node-cron
//   Make sure Redis is running
//   node app.js
//
// Env options:
//   PORT (default 3000)
//   JWT_SECRET (default 'change_this_secret')
//   REDIS_HOST, REDIS_PORT, REDIS_PASSWORD (optional)
//   BOOKS_CACHE_TTL (seconds, default 60)
//   BULK_CRON_SCHEDULE (cron expression, default '*/2 * * * *' -> every 2 minutes)

const express = require("express");
const Redis = require("ioredis");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const { v4: uuidv4 } = require("uuid");
const cron = require("node-cron");

const app = express();
app.use(express.json());
app.use(helmet());

/* ---------- Config ---------- */
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const BOOKS_CACHE_TTL = Number(process.env.BOOKS_CACHE_TTL || 60); // seconds
const BULK_CRON_SCHEDULE = process.env.BULK_CRON_SCHEDULE || "*/2 * * * *"; // every 2 minutes

/* ---------- Redis client ---------- */
const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
});
redis.on("connect", () => console.log("Connected to Redis:", `${REDIS_HOST}:${REDIS_PORT}`));
redis.on("error", (e) => console.error("Redis error:", e));

/* ---------- In-memory "DB" ----------
   For demo purposes, we keep users and books in memory.
   In production replace with a real persistent DB.
*/
const users = new Map(); // email -> { id, name, email, passwordHash }
const booksByUser = new Map(); // userId -> [ { id, title, author, ... } ]

/* ---------- Utilities ---------- */
const hashPassword = (password) => bcrypt.hash(password, 10);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

function generateToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });
}

async function getUserFromTokenHeader(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = Array.from(users.values()).find((u) => u.id === payload.sub);
    return user || null;
  } catch (e) {
    return null;
  }
}

// Middleware to protect routes
async function authMiddleware(req, res, next) {
  const user = await getUserFromTokenHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  req.user = user;
  next();
}

// Redis key helpers (user-scoped)
const cacheKeyForBooks = (userId) => `books:cache:${userId}`;
const bulkKeyForUser = (userId) => `books:bulk:${userId}`;

/* ---------- Routes: Auth ---------- */

// POST /signup { name, email, password }
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
    const normalized = String(email).toLowerCase();
    if (users.has(normalized)) return res.status(409).json({ error: "Email already registered" });
    const passwordHash = await hashPassword(password);
    const user = { id: uuidv4(), name, email: normalized, passwordHash };
    users.set(normalized, user);
    booksByUser.set(user.id, []); // initialize user's books array
    return res.status(201).json({ message: "User created", userId: user.id, email: user.email });
  } catch (err) {
    console.error("signup err:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /login { email, password }
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email, password required" });
    const normalized = String(email).toLowerCase();
    const user = users.get(normalized);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = generateToken(user);
    return res.json({ accessToken: token, expiresIn: "2h" });
  } catch (err) {
    console.error("login err:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ---------- Routes: Books CRUD with Redis cache ---------- */

// GET /books  -> uses Redis cache per user
app.get("/books", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = cacheKeyForBooks(userId);

    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] user=${userId} key=${cacheKey}`);
      return res.json({ source: "cache", books: JSON.parse(cached) });
    }

    console.log(`[CACHE MISS] user=${userId} key=${cacheKey}`);
    const books = booksByUser.get(userId) || [];

    // cache the result with TTL
    await redis.set(cacheKey, JSON.stringify(books), "EX", BOOKS_CACHE_TTL);
    return res.json({ source: "db", books });
  } catch (err) {
    console.error("GET /books err:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /books { title, author, ... } -> invalidate cache after insert
app.post("/books", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, author, ...rest } = req.body || {};
    if (!title || !author) return res.status(400).json({ error: "title and author required" });
    const newBook = { id: uuidv4(), title, author, ...rest, createdAt: new Date().toISOString() };
    const arr = booksByUser.get(userId) || [];
    arr.push(newBook);
    booksByUser.set(userId, arr);

    // invalidate cache
    await redis.del(cacheKeyForBooks(userId));
    console.log(`[CACHE INVALIDATE] POST by user=${userId}`);

    return res.status(201).json(newBook);
  } catch (err) {
    console.error("POST /books err:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /books/:id { title?, author?, ... } -> invalidate cache
app.put("/books/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.id;
    const arr = booksByUser.get(userId) || [];
    const idx = arr.findIndex((b) => b.id === bookId);
    if (idx === -1) return res.status(404).json({ error: "Book not found" });
    const book = arr[idx];
    const updates = req.body || {};
    const updated = { ...book, ...updates, updatedAt: new Date().toISOString() };
    arr[idx] = updated;
    booksByUser.set(userId, arr);

    // invalidate cache
    await redis.del(cacheKeyForBooks(userId));
    console.log(`[CACHE INVALIDATE] PUT by user=${userId}`);

    return res.json(updated);
  } catch (err) {
    console.error("PUT /books/:id err:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /books/:id -> invalidate cache
app.delete("/books/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.id;
    const arr = booksByUser.get(userId) || [];
    const idx = arr.findIndex((b) => b.id === bookId);
    if (idx === -1) return res.status(404).json({ error: "Book not found" });
    const removed = arr.splice(idx, 1)[0];
    booksByUser.set(userId, arr);

    // invalidate cache
    await redis.del(cacheKeyForBooks(userId));
    console.log(`[CACHE INVALIDATE] DELETE by user=${userId}`);

    return res.json({ deleted: removed });
  } catch (err) {
    console.error("DELETE /books/:id err:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ---------- Bulk insertion via Redis and Cron ---------- */

// POST /books/bulk { books: [ { title, author, ... }, ... ] }
// Enqueue payload into Redis list user-specific key and return immediately
app.post("/books/bulk", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = req.body && req.body.books;
    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({ error: "books must be a non-empty array" });
    }

    // push the entire bulk array as a single serialized entry onto the user's bulk list
    const redisKey = bulkKeyForUser(userId);
    await redis.rpush(redisKey, JSON.stringify({ id: uuidv4(), payload, enqueuedAt: new Date().toISOString() }));

    // Optionally set a TTL on the bulk key to prevent indefinite storage (e.g., 7 days)
    await redis.expire(redisKey, 7 * 24 * 60 * 60);

    console.log(`[BULK ENQUEUE] user=${userId} items=${payload.length}`);
    return res.json({ message: "Books will be added later." });
  } catch (err) {
    console.error("POST /books/bulk err:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ---------- Cron job: runs every 2 minutes (configurable) ---------- */

// Process all users' 'books:bulk:{userId}' lists.
// For each list: LRANGE all items, parse JSON, insert each book into user's DB array, then DEL the key.
// Use async non-blocking operations and catch errors per-user so one failure doesn't block others.

async function processBulkJobs() {
  try {
    console.log(`[CRON] Starting bulk processing at ${new Date().toISOString()}`);

    // Find keys matching pattern. Note: KEYS is fine for demo but not recommended in prod.
    const keys = await redis.keys("books:bulk:*");
    if (!keys || keys.length === 0) {
      console.log("[CRON] No bulk jobs found.");
      return;
    }

    // Process each key separately
    for (const key of keys) {
      try {
        const userId = key.split(":").pop();
        // get all entries for this user
        const entries = await redis.lrange(key, 0, -1); // array of JSON strings
        if (!entries || entries.length === 0) {
          // nothing to do; delete key if empty
          await redis.del(key);
          continue;
        }

        console.log(`[CRON] Processing key=${key} entries=${entries.length}`);

        // Parse and insert into in-memory DB
        let totalInserted = 0;
        for (const entryJson of entries) {
          try {
            const parsed = JSON.parse(entryJson);
            const arr = parsed.payload;
            if (!Array.isArray(arr)) continue;
            const userBooks = booksByUser.get(userId) || [];
            for (const b of arr) {
              // basic validation
              if (!b.title || !b.author) continue;
              const newBook = { id: uuidv4(), title: b.title, author: b.author, ...(b.meta || {}), createdAt: new Date().toISOString() };
              userBooks.push(newBook);
              totalInserted++;
            }
            booksByUser.set(userId, userBooks);
          } catch (innerErr) {
            console.error(`[CRON] failed parsing entry for key=${key}`, innerErr);
          }
        }

        // Delete the bulk key after successful insertion
        await redis.del(key);
        console.log(`[CRON] Completed key=${key} inserted=${totalInserted} items for user=${userId}`);

        // invalidate the user's books cache so subsequent GET fetches fresh data
        await redis.del(cacheKeyForBooks(userId));
        console.log(`[CRON] Invalidated cache for user=${userId}`);
      } catch (perKeyErr) {
        console.error(`[CRON] Error processing ${key}:`, perKeyErr);
        // do not throw — continue with other keys
      }
    }
    console.log(`[CRON] Bulk processing finished at ${new Date().toISOString()}`);
  } catch (err) {
    console.error("[CRON] Fatal error:", err);
  }
}

// Schedule cron using node-cron (runs every 2 minutes by default)
cron.schedule(BULK_CRON_SCHEDULE, () => {
  // run but don't block
  processBulkJobs().catch((e) => console.error("processBulkJobs uncaught:", e));
});
console.log(`Cron scheduled: '${BULK_CRON_SCHEDULE}' (every 2 minutes by default)`);

/* ---------- Misc endpoints for convenience ---------- */

// GET /health
app.get("/health", (req, res) => res.json({ ok: true, time: Date.now() }));

// GET /debug/state (NOT for production) - returns in-memory DB summary
app.get("/debug/state", (req, res) => {
  const usersList = Array.from(users.values()).map(u => ({ id: u.id, email: u.email, name: u.name }));
  const booksSummary = {};
  for (const [uid, arr] of booksByUser.entries()) {
    booksSummary[uid] = arr.length;
  }
  res.json({ users: usersList, booksCounts: booksSummary });
});

/* ---------- Start server ---------- */
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log("Endpoints:");
  console.log("  POST /signup         { name, email, password }");
  console.log("  POST /login          { email, password }");
  console.log("  GET  /books          (auth)");
  console.log("  POST /books          (auth) { title, author, ... }");
  console.log("  PUT  /books/:id      (auth) { ... }");
  console.log("  DELETE /books/:id    (auth)");
  console.log("  POST /books/bulk     (auth) { books: [ {...}, ... ] }");
  console.log("  GET  /debug/state    (debug)");
  console.log("Cron bulk schedule:", BULK_CRON_SCHEDULE);
});

/* ---------- Notes and Testing Instructions ----------
1) Create account and login:
   curl -X POST http://localhost:3000/signup -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com","password":"alicepass"}'
   curl -X POST http://localhost:3000/login  -H "Content-Type: application/json" -d '{"email":"alice@example.com","password":"alicepass"}'
   Response -> { accessToken: "..." }

2) Add a single book:
   curl -X POST http://localhost:3000/books -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
     -d '{"title":"Clean Code","author":"Robert C. Martin"}'

3) GET books (first time -> cache miss, subsequent within TTL -> cache hit):
   curl -H "Authorization: Bearer <token>" http://localhost:3000/books

   Observe console logs: [CACHE MISS] then [CACHE HIT]

4) Bulk queue:
   curl -X POST http://localhost:3000/books/bulk -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
     -d '{"books":[{"title":"Eloquent JS","author":"Marijn Haverbeke"},{"title":"You Don't Know JS","author":"Kyle Simpson"}]}'

   Returns immediately: "Books will be added later."

5) Cron job:
   - By default runs every 2 minutes. After cron runs, the queued books are added to the user's in-memory DB.
   - You can force-run `processBulkJobs()` manually in code or temporarily change `BULK_CRON_SCHEDULE` to a faster value (e.g., '* * * * *' -> every minute) for testing.

6) After cron processed: GET /books should show newly inserted books. Console will show logs such as:
   [CRON] Processing key=books:bulk:<userId> entries=1
   [CRON] Completed key=books:bulk:<userId> inserted=2 items for user=<userId>
   [CRON] Invalidated cache for user=<userId>

7) Notes & production cautions:
   - Using Redis KEYS is fine for demo but not advisable in production. Use SCAN for large datasets.
   - Do not use in-memory storage in production — use persistent DB.
   - For atomic bulk processing consider Lua scripts, streams, or consumer groups (e.g., Redis streams).
   - Add robust validation, rate-limiting, logging, and monitoring when moving to production.
   - Ensure JWT secret stored safely (env / secret manager) and use HTTPS.

--------------------------------------------- */

