const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

app.listen(3000, () => {
  console.log("Server is listening the request at port 3000");
});



// adding new book
app.post("/books", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let newBook = {
    id: data.length + 1,
    ...req.body,
  };
  data.push(newBook);
  fs.writeFileSync("./db.json", JSON.stringify(data));
  res.send("Book Added Successfully...");
});

// searching books by author name
app.get("/books/search", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  console.log();
  let search = data.filter((ele) =>
    ele.author.toLowerCase().includes(req.query.author)
  );
  if (search.length == 0) {
    res.send("No books found");
  } else {
    res.json(search);
  }
});

// fetching books details...
app.get("/books", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  res.json(data);
});



// fetching books by id...
app.get("/books/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let search = data.filter((ele) => ele.id == req.params.id);
  if (search) {
    res.json(search);
  } else {
    res.send("Book not found");
  }
});



//update book by id...
app.put("/books/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let updatedData = data.map((ele) => {
    if (ele.id == req.params.id) {
      ele = { ...ele, ...req.body };
      return ele;
    } else {
      return ele;
    }
  });
  fs.writeFileSync("./db.json", JSON.stringify(updatedData));
  res.send("Book updated successfully");
});

// delete book by id...
app.delete("/books/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  let check = false;
  data.filter((ele) => {
    if (ele.id == req.params.id) {
      check = true;
    }
  });
  if (!check) {
    res.send("Book is not present or already deleated");
    return;
  }
  let search = data.filter((ele) => ele.id != req.params.id);
  fs.writeFileSync("./db.json", JSON.stringify(search));
  res.send("Book deleated successfully...");
});

// no router function found
app.use((req, res) => {
  res.status(404).send("Undefined routes");
});
