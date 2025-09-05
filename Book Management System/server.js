const express = require("express");
const adminRouter = require("./routes/admin.route");
const readerRouter = require("./routes/reader.route");
const loggerMiddleware = require("./utils/loggerMiddleware");

const app = express();

app.use(express.json());


app.listen(3000, () => {
  console.log("Server is listening to the port 3000");
});

//logging the request
app.use(loggerMiddleware);

//admin router
app.use("/admin", adminRouter);

//reader router
app.use("/reader", readerRouter);

app.use((req, res) => {
  res.status(404).json({ msg: "Undefined Route" });
});
