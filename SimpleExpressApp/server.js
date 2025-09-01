const express = require("express");
const fs = require("fs");
const app = express();

app.listen(3000, () => {
  console.log("Server is running...");
});

app.get("/users/get", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./data.txt", "utf-8"));
  res.json(data[0]);
});

app.get("/users/list", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./data.txt", "utf-8"));
  res.json(data);
});

app.use((req, res) => {
  res.send("Status 404 not found");
});
