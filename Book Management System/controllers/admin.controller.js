const { getData, saveData } = require("../models/admin.model");

//fetching all books
function getAllBooks(req, res) {
  let books = getData();
  if (books.length == 0) {
    res.json({ msg: "No books available." });
  } else {
    res.json(books);
  }
}

//fetching books by id
function getBookById(req, res) {
  let books = getData();
  let search = books.filter((ele) => ele.id == req.params.id);
  if (search.length == 0) {
    res.json({ msg: "Book not available" });
  } else {
    res.json(search);
  }
}

//adding a book
function addBook(req, res) {
  let books = getData();
  let newBook = {
    ...req.body,
    id: books.length + 1,
  };
  books.push(newBook);
  saveData(books);
  res.json({ msg: "Book added successfully" });
}

//updating a book
function updateBookById(req, res) {
  let id = req.params.id;
  console.log("Body:", req.body);
  let books = getData();
  let check = false;
  let updatedBooks = books.map((ele) => {
    if (ele.id == id) {
      ele = { ...ele, ...req.body };
      check = true;
      return ele;
    } else {
      return ele;
    }
  });
  if (check) {
    saveData(updatedBooks);
    res.json({ msg: `Book with id : ${id} got updated...` });
  } else {
    res.status(406).json({ msg: `Book with id: ${id} is not available` });
  }
}

//deleating book by id
function deleteBookById(req, res) {
  let data = getData();
  let id = req.params.id;
  let updatedData = data.filter((ele) => ele.id != id);
  if (data.length == updatedData.length) {
    res.status(406).json({ msg: `Book with id: ${id} is not available` });
  } else {
    saveData(updatedData);
    res.json({ msg: "Book deleated" });
  }
}

module.exports = {
  getAllBooks,
  getBookById,
  addBook,
  updateBookById,
  deleteBookById,
};
