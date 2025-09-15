const express = require("express");
const { addPatient, getAllPatient } = require("../controllers/patient.controller");

const patientRoute = express.Router();

// adding learner
patientRoute.post("/", addPatient);


// fetching all learner
patientRoute.get("/", getAllPatient);

module.exports = patientRoute;