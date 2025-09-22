const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function loginController(req, res) {
  try {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email });
    if (!user) {
      res.json({ msg: "User with this email not present" });
      return;
    }
    let match = bcrypt.compare(password, user.password);
    if (match) {
      let token = jwt.sign({userId: user._id},"alphabeta");
      
      
      res.json({ msg: "User login successfully" , token});
    } else {
      res.json({ msg: "Either email or password not correct" });
    }
  } catch (error) {
    res.json({ msg: "Something went wrong." });
  }
}

module.exports = loginController;
