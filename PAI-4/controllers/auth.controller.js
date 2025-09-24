const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function signupController(req, res) {
  try {
    let { password } = req.body;

    bcrypt.hash(password, saltRounds, async function (err, hash) {
      await userModel.create({ ...req.body, password: hash });
    });

    res.json({ msg: "User registered successfully" });
  } catch (error) {
    res.json({ msg: "Something went wrong." });
  }
}

async function loginController(req, res) {
  try {
    let {email, password} = req.body;
    let user = await userModel.findOne({ email });
    await bcrypt.compare(password, user.password);
    let token = jwt.sign({userId:user._id},process.env.SecretKey);

    res.json({ msg: "User loged in successully", token });
  } catch (error) {
    res.json({ msg: "Something went wrong." });
  }
}

module.exports = { signupController, loginController };
