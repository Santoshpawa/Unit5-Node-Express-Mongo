const express = require("express");
const connectToDb = require("./configs/mongo.config");
const mentorRoute = require("./routers/mentor.route");
const learnerRoute = require("./routers/learner.route");
const sessionRoute = require("./routers/session.route");
require("dotenv").config();

const app = express();

app.use(express.json());

app.use("/mentor",mentorRoute);

app.use("/learner", learnerRoute);

app.use("/session", sessionRoute);

app.use((req,res)=>{
    res.json({msg:"Undefined Route"});
})







connectToDb().then(()=>{
    app.listen(process.env.Port,()=>{
        console.log("Server started and listening to port 3000")
    })
})