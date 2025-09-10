const express = require("express");
const connectToDb = require("./configs/mongo.config");
const usersRouter = require("./routers/users.router");

const app = express();

app.use(express.json());

app.use("/users", usersRouter);


connectToDb().then(()=>{
    app.listen(3000,()=>{
        console.log("Server is listening to the request at port 3000")
    })
})