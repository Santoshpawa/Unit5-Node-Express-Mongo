const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
require("dotenv").config();

// sign up controller
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

// login controller
async function loginController(req, res) {
  try {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email });
    let match = await bcrypt.compare(password, user.password);
    if(match){
        let token = jwt.sign({ userId: user._id }, process.env.SecretKey);
        res.json({ msg: "User loged in successully", token });
    }else{
        res.json({msg: "Either email or password is wrong"});
    }
    
  } catch (error) {
    res.json({ msg: "Something went wrong." });
  }
}

// forget-password controller
async function forgetPasswordController(req, res) {
  try {
    let userId = req.userId;
    let user = await userModel.findOne({ _id: userId });
    if (!user) {
      res.json({ msg: "User not present." });
      return;
    }
    let token = jwt.sign({ userId: user._id }, process.env.SecretKey);
    bcrypt.hash(token, saltRounds, async function (err, hash) {
      user.passwordResetToken = hash;
      await user.save();
    });
    
    res.json({ msg: "Password link send to your email", token ,user});
  } catch (error) {
    res.json({ msg: "Something went wrong." });
    console.log(error);
  }
}

//reset password
async function resetPasswordController(req, res) {
  try {
    let userId = req.userId;
    let user = await userModel.findOne({ _id: userId });
    if (!user) {
      res.json({ msg: "User not present." });
      return;
    }
    let token = req.params.token;
   
    await bcrypt.compare(token, user.passwordResetToken);
   
    let newPassword = req.body.newPassword;
    bcrypt.hash(newPassword, saltRounds, async function (err, hash) {
      user.password = hash;
      await user.save();
    });
    
    res.json({msg: "Password reset successfully"});
  } catch (error) {
    res.json({ msg: "Something went wrong." });
    console.log(error);
  }
}

module.exports = {
  signupController,
  loginController,
  forgetPasswordController,
  resetPasswordController,
};
