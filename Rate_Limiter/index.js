const express = require("express");
const router = require("./routes/api");

const app = express();

// rate-limeter middleware on application level


app.use(express.json());

app.use("/", router);

app.use((req, res) => {
  res.status(406).json({ msg: "Undefined Route" });
});

app.listen(3000, () => {
  console.log("Server is listening to the request at port 3000.");
});
