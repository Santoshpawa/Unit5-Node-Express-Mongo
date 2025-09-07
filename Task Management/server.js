const connectToDb = require("./configs/mongodb.config");
const express = require("express");
const taskRouter = require("./routes/tasks.route");

const app = express();
connectToDb().then(() => {
  app.listen(3000, () => {
    console.log("Server is listenig the request at port 3000");
  });
});

app.use(express.json());

app.use("/tasks", taskRouter);

app.use((req, res) => {
  res.status(400).json({ msg: "Undefined route" });
});
