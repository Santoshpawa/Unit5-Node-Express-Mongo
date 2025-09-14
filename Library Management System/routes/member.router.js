const express = require("express");
const { getAllMembers, addMembers, borrowingBook, returningBook, getAllIssuedBooks } = require("../controllers/member.controller");
const memberRouter = express.Router();


//fetching all members
memberRouter.get("/", getAllMembers);

// adding new members
memberRouter.post("/", addMembers);

// borrowing book
memberRouter.patch("/borrow-book/:memberId/:bookId", borrowingBook);

//returning a book
memberRouter.patch("/return-book/:memberId/:bookId", returningBook);

memberRouter.get("/books/:memberId", getAllIssuedBooks);


module.exports = memberRouter;