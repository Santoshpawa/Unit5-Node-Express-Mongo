const express = require("express");
const { signupController, loginController, forgetPasswordController, resetPasswordController } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const authRouter = express.Router();

authRouter.post("/register", signupController);

authRouter.post("/login",loginController);

authRouter.post("/forget-password", authMiddleware , forgetPasswordController);

authRouter.post("/reset-password/:token", authMiddleware, resetPasswordController);



module.exports = authRouter;