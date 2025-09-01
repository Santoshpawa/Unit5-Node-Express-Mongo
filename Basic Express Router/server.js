const express = require("express");
const app = express();

app.listen(3000, () => {
  console.log("Server is running...");
});

app.get("/home", (req, res) => {
  res.send("<h1>This is home page</h1>");
});

app.get("/message", (req, res) => {
  res.json({ message: "This is a message" });
});

app.get("/contact", (req, res) => {
  res.send("Call me: @ 7830888888");
});

// catch all undefined routes and this route handler should be placed at the bottom of the application always

app.use((req, res) => {
  res.send("Status 404 not found");
});
