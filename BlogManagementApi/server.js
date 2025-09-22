const express = require("express");
const connectToDb = require("./configs/mongo.config");
const signupRouter = require("./routers/signup.router");
const loginRouter = require("./routers/login.router");
const blogRouter = require("./routers/blog.router");
require("dotenv").config();
const app = express();

app.use(express.json());

app.use("/signup", signupRouter);

app.use("/login", loginRouter);

app.use("/blog", blogRouter);

connectToDb().then(()=>{
  app.listen(process.env.Port,()=>{
    console.log("Server started listening to port 3000");
  })
})