const express = require("express");
const fileReading = require("./read.js");
const systemDetails = require("./systemDetails.js");
const getIP = require("./ipAddress.js");
const app = express();

app.listen(3000, () => {
  console.log("server is running...");
});

app.get("/test", (req, res) => {
  res.json("This is a testing route");
});

app.get("/readfile", (req, res) => {
  res.json(fileReading("Data"));
});

app.get("/systemdetails", (req, res) => {
  res.json(systemDetails());
});

app.get("/getip", (req, res) => {
  res.json(getIP());
});
