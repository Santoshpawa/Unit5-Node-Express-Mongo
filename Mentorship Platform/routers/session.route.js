const express = require("express");
const { addSession, getAllSession } = require("../controllers/session.controller");

const sessionRoute = express.Router();

// add a new session
sessionRoute.post("/", addSession);

// get all sessions
sessionRoute.get("/", getAllSession);

module.exports = sessionRoute;
