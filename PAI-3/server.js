const express = require("express");
const connectToDb = require("./configs/mongo.config");
const restaurantsRouter = require("./routers/restaurant.route");
require("dotenv").config();

const app = express();

app.use(express.json());

// restaurants end point
app.use("/restaurants", restaurantsRouter);

// for handling undefined routes
app.use((req, res) => {
  res.status(404).json({ msg: "Undefined Route" });
});

connectToDb().then(() => {
  app.listen(process.env.Port, () => {
    console.log("Server Started to listen requests at port 3000");
  });
});
