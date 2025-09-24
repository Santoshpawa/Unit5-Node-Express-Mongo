const express = require("express");
const connectToDb = require("./configs/mongo.config");
const authRouter = require("./routes/auth.route");
require("dotenv").config();

const app = express();

app.use(express.json());


app.use("/auth", authRouter);



connectToDb().then(()=>{
    app.listen(process.env.Port,()=>{
        console.log("Server is listening to the requests at port 3000");
    })
})