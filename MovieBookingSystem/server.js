const express = require("express");
const connectToDb = require("./configs/mongo.config");
const movieRouter = require("./routers/movie.router");
const userRouter = require("./routers/user.router");
const bookingRouter = require("./routers/booking.router");
require("dotenv").config();

const app = express();

app.use(express.json());

app.use("/movies", movieRouter);

app.use("/users", userRouter);

app.use("bookings", bookingRouter);

connectToDb().then(()=>{
    app.listen(process.env.Port,()=>{
        console.log("Server started to listen to the port 3000");
    })
})





