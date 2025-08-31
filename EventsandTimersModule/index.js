const express = require("express");
const delayFunction = require("./delay.js");
const enventLog = require("./eventLogger.js");
const app = express();

app.listen(3000, () => {
  console.log("Server is running....");
});

app.get("/test", (req, res) => {
  console.log(req.query);
  res.send("Test route is working fine");
});

app.get("/emit", (req, res) => {
  let result = enventLog();
  console.log(result);
  res.json(result);
});

app.get("/delay", async (req, res) => {

    let {message,time}= req.query;
    if(message !=="Waited" || !Number(time)){
        res.send("Invalid request query !!!")
        return;
    }
  let result = await delayFunction(req.query);
  console.log(result);
  res.json(result);
});
