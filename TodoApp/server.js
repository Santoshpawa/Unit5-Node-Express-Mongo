const express = require("express");
const todosRouter = require("./routes/todos.route");


const app = express();
app.use(express.json());

app.listen(3000, () => {
  console.log("Server is listening to the request at port 3000...");
});

app.use("/todos", todosRouter);


app.use((req, res) => {
  res.status(404).send("Undefined Route !!!");
});
