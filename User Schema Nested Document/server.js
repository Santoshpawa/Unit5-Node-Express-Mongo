const express = require("express");
const connectToDb = require("./configs/mongo.config");
const userRouter = require("./routers/user.route");

const app = express();

app.use(express.json());


app.use("/user", userRouter);




connectToDb().then(()=>{
    app.listen(3000,()=>{
        console.log("server is listening to the port 3000");
    })
})