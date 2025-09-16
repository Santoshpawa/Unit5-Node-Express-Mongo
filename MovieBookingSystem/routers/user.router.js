const express = require("express");
const { getAllUsers, addNewUser } = require("../controllers/user.controller");

const userRouter = express.Router();


//fetching all files
userRouter.get("/", getAllUsers);

//adding new user
userRouter.post("/", addNewUser);

module.exports = userRouter;