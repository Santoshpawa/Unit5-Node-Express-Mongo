const express = require("express");
const {
  getAllBooks,
  getBookById,
  addBook,
  updateBookById,
  deleteBookById,
} = require("../controllers/admin.controller");
const bookStructure = require("../middlewares/bookStructure");

const adminRouter = express.Router();

//fetching all books
adminRouter.get("/books", getAllBooks);

//fetching book by id
adminRouter.get("/books/:id", getBookById);

//adding new book
adminRouter.post("/books", bookStructure, addBook);

//update a book
adminRouter.patch("/books/:id", updateBookById);

// deleating a book
adminRouter.delete("/books/:id", deleteBookById);

module.exports = adminRouter;
