const express = require("express");
const { addConsultation, getAllConsultation } = require("../controllers/consultation.controller");

const consultationRoute = express.Router();

// add a new session
consultationRoute.post("/", addConsultation);

// get all sessions
consultationRoute.get("/", getAllConsultation);

module.exports = consultationRoute;
