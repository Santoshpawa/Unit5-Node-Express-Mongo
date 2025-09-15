const express = require("express");
const { addLearner, getAllLearner } = require("../controllers/learner.controller");

const learnerRoute = express.Router();

// adding learner
learnerRoute.post("/", addLearner);


// fetching all learner
learnerRoute.get("/", getAllLearner);

module.exports = learnerRoute;