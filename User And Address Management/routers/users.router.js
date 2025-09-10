const express = require("express");
const {
  getAllUsers,
  addUser,
  addNewAddress,
  summary,
  getUserById,
  deleteAddressById,
} = require("../controllers/users.controller");

const usersRouter = express.Router();

// fetching all users details
usersRouter.get("/", getAllUsers);

// adding user
usersRouter.post("/", addUser);

//add new address
usersRouter.post("/:userId/address", addNewAddress);

//summary
usersRouter.get("/summary", summary);

// get user details by id
usersRouter.get("/:id", getUserById);


// deleting a address from a user
usersRouter.delete("/:id/:address", deleteAddressById);

module.exports = usersRouter;
