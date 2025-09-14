const express = require("express");
const { getAllBooks, addBook } = require("../controllers/book.controller");

const bookRouter = express.Router();

//fetching all books
bookRouter.get("/", getAllBooks);

//add book
bookRouter.post("/", addBook);


module.exports = bookRouter;