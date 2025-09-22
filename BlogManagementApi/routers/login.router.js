const express = require("express");
const loginController = require("../controllers/login.controll");

const loginRouter = express.Router();


loginRouter.post("/", loginController);

module.exports = loginRouter;