// app.js
// Demonstrates Redis caching with invalidation
//
// Steps to run:
//   npm init -y
//   npm install express ioredis body-parser
//   Make sure Redis is running (e.g., `redis-server`)
//   node app.js

const express = require("express");
const bodyParser = require("body-parser");
const Redis = require("ioredis");

const app = express();
app.use(bodyParser.json());

// ----- Redis client -----
const redis = new Redis({
  host: "127.0.0.1", // change if needed
  port: 6379,
});

// ----- Simulated Database -----
let items = [
  { id: 1, name: "Pizza" },
  { id: 2, name: "Burger" },
];
let nextId = 3;

// Redis cache key
const CACHE_KEY = "items:all";
const CACHE_TTL = 60; // 1 minute

// ----- Routes -----

// GET /items → return cached or DB data
app.get("/items", async (req, res) => {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      console.log("Cache hit for /items");
      return res.json(JSON.parse(cached));
    }

    console.log("Cache miss for /items");
    // fetch from "DB"
    const data = items;
    // cache it
    await redis.set(CACHE_KEY, JSON.stringify(data), "EX", CACHE_TTL);
    return res.json(data);
  } catch (err) {
    console.error("Error in GET /items:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /items → add new item + invalidate cache
app.post("/items", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const newItem = { id: nextId++, name };
    items.push(newItem);

    // invalidate cache
    await redis.del(CACHE_KEY);
    console.log("Cache invalidated after POST /items");

    return res.status(201).json(newItem);
  } catch (err) {
    console.error("Error in POST /items:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /items/:id → update item + invalidate cache
app.put("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const item = items.find((i) => i.id === id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.name = name;

    await redis.del(CACHE_KEY);
    console.log("Cache invalidated after PUT /items/:id");

    return res.json(item);
  } catch (err) {
    console.error("Error in PUT /items/:id:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /items/:id → delete item + invalidate cache
app.delete("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return res.status(404).json({ error: "Item not found" });

    const deleted = items.splice(index, 1)[0];

    await redis.del(CACHE_KEY);
    console.log("Cache invalidated after DELETE /items/:id");

    return res.json(deleted);
  } catch (err) {
    console.error("Error in DELETE /items/:id:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ----- Start server -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Routes:");
  console.log("GET    /items");
  console.log("POST   /items  { name }");
  console.log("PUT    /items/:id  { name }");
  console.log("DELETE /items/:id");
});
