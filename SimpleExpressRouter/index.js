const express = require("express");

const app = express();

app.listen(30, () => {
  console.log(`Server is running on http://localhost:${30}`);
});

app.get("/home", (req, res) => {
  res.json("This is home page");
});

app.get("/contactus", (req, res) => {
  res.json("This is Contactus page");
});

app.get("/about", (req, res) => {
  res.json("This is About page");
});
