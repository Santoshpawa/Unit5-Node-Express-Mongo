const UserModel = require("../models/user.model");

// fetching all user details
async function getAllUser(req, res) {
  try {
    let users = await UserModel.find();
    res.json(users);
  } catch (error) {
    res.json({ msg: "Something went wrong." });
  }
}

// add user
async function addUser(req, res) {
  try {
    await UserModel.create(req.body);
    res.json({ msg: "New User added" });
  } catch (error) {
    res.json({ msg: "Something went wrong" });
  }
}

// updating user information by id
async function updateUserById(req, res) {
  try {
    let id = req.params.id;
    let user = await UserModel.findById(id);
    await UserModel.findByIdAndUpdate(id, req.body);
    res.json({ msg: "User details updated" });
  } catch (error) {
    res.json({ msg: "Something went wrong." });
  }
}

//delete user by id
async function deleteUserById(req, res) {
  try {
    let id = req.params.id;
    await UserModel.findByIdAndDelete(id);
    res.json({ msg: "User deleated Successfully" });
  } catch (error) {
    res.json({ msg: "Something went wrong." });
  }
}

module.exports = {
  getAllUser,
  addUser,
  updateUserById,
  deleteUserById,
};
