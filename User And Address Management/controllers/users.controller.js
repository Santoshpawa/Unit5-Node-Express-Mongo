const UserModel = require("../models/user.model");

async function getAllUsers(req, res) {
  try {
    let userX = await UserModel.find();
    res.json({ userX });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
}

// adding new user
async function addUser(req, res) {
  try {
    await UserModel.create(req.body);
    res.json({ msg: "User added successfully" });
  } catch (error) {
    res.json({ msg: error });
  }
}

// adding new address
async function addNewAddress(req, res) {
  try {
    let userId = req.params.userId;
    let [user] = await UserModel.find({ _id: userId });
    console.log(user);
    user.address.push(req.body);
    await user.save();
    res.json({ msg: "New address added" });
  } catch (error) {
    res.json({ msg: `Error: ${error}` });
  }
}

// summary
async function summary(req, res) {
  try {
    let numberOfUser = await UserModel.find();
    let totalAddress = 0;
    let userAndAddress = [];
    numberOfUser.map((user) => {
      totalAddress += user.address.length;
      userAndAddress.push({
        name: user.name,
        numberOfAddress: user.address.length,
      });
    });
    let summary = {
      totalUsers: numberOfUser.length,
      totalAddress: totalAddress,
      userAndAddress: userAndAddress,
    };
    res.json(summary);
  } catch (error) {
    res.json({ msg: `Error: ${error}` });
  }
}

// get user details by id
async function getUserById(req, res) {
  try {
    let id = req.params.id;
    let user = await UserModel.find({ _id: id });
    res.json(user);
  } catch (error) {
    res.json({ msg: error });
  }
}

// delete address by id
async function deleteAddressById(req, res) {
  try {
    let userId = req.params.id;
    let addressId = req.params.address;
    console.log(addressId)
    let [user] = await UserModel.find({ _id: userId });

    user.address = user.address.filter((add) => add._id != addressId);
    await user.save();
    res.json({ msg: "Address deleted" });
  } catch (error) {
    res.json({ msg: "Something went wrong", error: error });
    console.log(error)
  }
}
module.exports = {
  getAllUsers,
  addUser,
  addNewAddress,
  summary,
  getUserById,
  deleteAddressById,
};
