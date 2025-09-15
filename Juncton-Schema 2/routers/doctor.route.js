const express = require("express");
const { addDoctor, getAllDoctor } = require("../controllers/doctor.controller");

const doctorRoute = express.Router();


// adding mentors
doctorRoute.post("/", addDoctor);

//fetching all mentor
doctorRoute.get("/", getAllDoctor);



module.exports = doctorRoute;