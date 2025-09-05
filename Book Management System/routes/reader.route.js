const express = require("express");
const { getAllBooks } = require("../controllers/admin.controller");
const { borrowBookById, returnBookById } = require("../controllers/reader.controller");

const readerRouter = express.Router();

//fetching the books
readerRouter.get("/books", getAllBooks);

//borrowing a book
readerRouter.patch("/borrow/:id", borrowBookById);

//returning book
readerRouter.patch("/return/:id", returnBookById);

module.exports = readerRouter;
