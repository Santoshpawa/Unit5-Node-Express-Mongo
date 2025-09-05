const { getData, saveData } = require("../models/admin.model");
const returnCondition = require("../utils/returnCondition.util");
const bookTransactions = require("../utils/transactionLogger");

//borrow book
function borrowBookById(req, res) {
  let books = getData();
  let id = req.params.id;
  let check = false;
  let updatedBooks = books.map((ele) => {
    if (ele.id == id) {
      check = true;
      if (!ele.browwedBy) {
        let date = new Date();
        let borrowedDate = `${date.getFullYear()}-${
          date.getMonth() + 1
        }-${date.getDate()}`;
        ele = {
          ...ele,
          status: "borrowed",
          borrowedBy: req.body.readerName,
          borrowedDate: borrowedDate,
        };
        let transaction = {
          bookTitle: ele.title,
          borrowedBy: ele.borrowedBy,
          issuedOn: borrowedDate,
        };
        bookTransactions(transaction);
        res.json({ msg: "💹 Book Issued " });
        return ele;
      } else {
        res.json({ mgs: `Book is issued to other reader : ${ele.browwedBy}` });
        return ele;
      }
    } else {
      return ele;
    }
  });
  if (check) {
    saveData(updatedBooks);
  } else {
    res.status(406).json({ msg: `Book with id: ${id} not present` });
  }
}

//return book
function returnBookById(req, res) {
  let books = getData();
  let id = req.params.id;
  let check = false;
  let date = new Date();
  let returnDate = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}`;

  let updatedBooks = books.map((ele) => {
    if (ele.id == id) {
      let criteria = returnCondition(ele.borrowedDate, returnDate);
      if (criteria > 3) {
        check = true;
        let transaction = {
          bookTitle: ele.title,
          returnedBy: ele.borrowedBy,
          returnedOn: returnDate,
        };
        bookTransactions(transaction);
        ele.status = "available";
        delete ele.borrowedBy;
        delete ele.borrowedDate;

        return ele;
      } else {
        res.json({ msg: "Book cannot be returned within 3 days" });
        return ele;
      }
    } else {
      return ele;
    }
  });
  if (check) {
    res.json({ msg: "Book Returned Successfully" });
    saveData(updatedBooks);
  }
}

module.exports = { borrowBookById, returnBookById };
