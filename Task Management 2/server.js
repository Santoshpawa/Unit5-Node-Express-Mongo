const express = require("express");
const connectToDb = require("./configs/mongo.config");
const taskRouter = require("./routers/task.router");

const app = express();

app.use(express.json());

// routes
app.use("/tasks", taskRouter);

connectToDb().then(() => {
  app.listen(3000, () => {
    console.log("Server is listening to the request at port 3000");
  });
});



