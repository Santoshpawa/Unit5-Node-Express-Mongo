const express = require("express");
const connectToDb = require("./configs/mongo.config");
const vehicleRouter = require("./routers/vehicle.route");

const app = express();

app.use(express.json());


app.use("/vehicle", vehicleRouter);




connectToDb().then(()=>{
    app.listen(3000,()=>{
        console.log("server is listening to the port 3000");
    })
})