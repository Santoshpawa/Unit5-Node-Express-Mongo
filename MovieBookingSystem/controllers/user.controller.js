const userModel = require("../models/user.model");

// fetching all Users
async function getAllUsers(req, res) {
  try {
    let Users = await userModel.find();
    res.json(Users);
  } catch (error) {
    res.json({ msg: "Something went wrong" });
  }
}

// adding new User
async function addNewUser(req, res) {
  try {
    await userModel.create(req.body);
    res.json({ msg: "User added." });
  } catch (error) {
    res.json({ msg: "Something went wrong" });
  }
}

module.exports = { getAllUsers, addNewUser };
