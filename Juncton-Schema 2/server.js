const express = require("express");
const connectToDb = require("./configs/mongo.config");
const docterRoute = require("./routers/doctor.route");
const patientRoute = require("./routers/patient.route");
const consultationRoute = require("./routers/consultation.route");
require("dotenv").config();

const app = express();

app.use(express.json());

app.use("/doctor",docterRoute);

app.use("/patient", patientRoute);

app.use("/consultation", consultationRoute);

app.use((req,res)=>{
    res.json({msg:"Undefined Route"});
})







connectToDb().then(()=>{
    app.listen(process.env.Port,()=>{
        console.log("Server started and listening to port 3000")
    })
})