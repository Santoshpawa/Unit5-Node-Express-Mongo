const express = require("express");
const { addMentor, getAllMentor } = require("../controllers/mentor.controller");

const mentorRoute = express.Router();


// adding mentors
mentorRoute.post("/", addMentor);

//fetching all mentor
mentorRoute.get("/", getAllMentor);



module.exports = mentorRoute;