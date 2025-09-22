const express = require("express");
const { signupController } = require("../controllers/signup.controller");

const signupRouter = express.Router();

signupRouter.post("/", signupController);



module.exports = signupRouter;