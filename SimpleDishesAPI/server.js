const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json()); // to parse the body of incoming request

app.listen(3000, (req, res) => {
  console.log("Server is listening to the incoming request at port 3000....");
});

app.get("/dishes/get", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));

  let result = data.filter((ele) => ele.name.includes(req.query.name));
  if (result.length == 0) {
    res.send("No dishes found");
    return;
  }
  res.json(result);
});

app.post("/dishes", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let newDish = { id: data.length + 1, ...req.body };
  data.push(newDish);
  fs.writeFileSync("./db.json", JSON.stringify(data));
  res.send("Data added successfully");
});

app.get("/dishes", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  res.json(data);
});

app.get("/dishes/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let result = data.filter((ele) => ele.id == req.params.id);
  res.json(result);
});

app.put("/dishes/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let updatedData = data.map((ele) => {
    if (ele.id == req.params.id) {
      ele = { ...ele, ...req.body };
      return ele;
    } else {
      return ele;
    }
    // console.log(ele)
  });
  fs.writeFileSync("./db.json", JSON.stringify(updatedData));
  res.send("Dish updated successfully");
});

app.delete("/dishes/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));

  let dAd = data.filter((ele) => ele.id !== req.params.id);
  fs.writeFileSync("./db.json", JSON.stringify(dAd));
  res.send("Data deleted successfully...");
});

app.use((req, res) => {
  if (req.url === "/favicon.ico") {
    res.send("Status 404 : Invalid request");
    return;
  }
  console.log(req.query.name);
  res.send("Status 404 : Invalid request");
});
