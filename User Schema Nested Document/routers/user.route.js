const express = require("express");
const {} = require("../controllers/vehicle.controller");
const {
  getAllUser,
  addUser,
  updateUserById,
  deleteUserById,
} = require("../controllers/user.controller");

const userRouter = express.Router();

// fetching all user details
userRouter.get("/", getAllUser);

// adding new user
userRouter.post("/", addUser);

// update user by id
userRouter.patch("/:id", updateUserById);

// delete user by Id
userRouter.delete("/:id", deleteUserById);

module.exports = userRouter;
