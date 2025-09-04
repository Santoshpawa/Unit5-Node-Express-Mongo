const express = require("express");
const ticketRouter = require("./routes/ticket.route");

const app = express();

app.use(express.json());

app.listen(3000, () => {
  console.log("Server is listening to the request coming on port number 3000");
});

app.use("/ticket", ticketRouter);

app.use((req, res) => {
  res.json({ msg: "Undefined Route..." });
});
