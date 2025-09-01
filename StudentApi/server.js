const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

app.listen(3000, () => {
  console.log("Server is listening to port 3000");
});

// adding a new student
app.post("/students", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let newStudent = {
    id: data.length + 1,
    ...req.body,
  };
  data.push(newStudent);
  fs.writeFileSync("./db.json", JSON.stringify(data));
  res.send("Student details added successfully");
});

// fetching students details
app.get("/students", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  res.json(data);
});

//fetching students by course name
app.get("/students/search", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let search = data.filter((ele)=>ele.course.includes(req.query.course));
  res.json(search);
});

//fetching students details with id
app.get("/students/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let search = data.filter((ele) => ele.id == req.params.id);
  if (search.length == 0) {
    res.status(404).send("Student not found");
    return;
  }
  res.json(search);
});

// updating students record
app.put("/students/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let updatedData = data.map((ele) => {
    if (ele.id == req.params.id) {
      ele = {
        ...ele,
        ...req.body,
      };
      return ele;
    } else {
      return ele;
    }
  });
  fs.writeFileSync("./db.json", JSON.stringify(updatedData));
  res.send("Students details updated successfully");
});

// deleting students details
app.delete("/students/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let updatedData = data.filter((ele) => ele.id != req.params.id);
  fs.writeFileSync("./db.json", JSON.stringify(updatedData));
  res.json(search);
});

app.use((req, res) => {
  res.status(404).send("Undefined route");
});
