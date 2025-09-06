const express = require("express");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  limit: 5, // Limit each IP to 5 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  // store: ... , // Redis, Memcached, etc. See below.
});

const router = express.Router();

router.get("/public", (req, res) => {
  res.json({ msg: "This is a public endpoint!" });
});

router.get("/limited", limiter, (req, res) => {
  res.json({ msg: "You have access to this limited endpoint!" });
});

module.exports = router;
