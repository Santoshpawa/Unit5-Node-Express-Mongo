const express = require("express");
const parseURL = require("./parseURL.js");
const filePath = require("./filepath.js");
const app = express();

app.listen(3000, () => {
  console.log("Server is running...");
});

app.get("/test", (req, res) => {
  let { obj } = req.query;
  console.log(obj);
  res.json("Test route is working");
});

app.get("/parseurl", (req, res) => {
  let {url,duration} = req.query;
  console.log(`${url}&duration=${duration}`);
  if (!`${url}`) {
    res.json("Invalid url");
  }
  try {
    const result = parseURL(`${url}&duration=${duration}`);
    res.json(result);
  } catch (error) {
    res.json("Status 404");
  }
});

app.get('/fileinfo',(req,res)=>{
    let {filepath} = req.query;
    try {
        let result = filePath(filepath);
        res.json(result)
    } catch (error) {
        res.send("Invalid file path")
    }
})