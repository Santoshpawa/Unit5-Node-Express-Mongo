const bookModel = require("../models/book.model");

//fetching all books
async function getAllBooks(req, res) {
  try {
    let books = await bookModel.find();
    res.json({ msg: books });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
}

// adding new book
async function addBook(req,res){
  try {
    await bookModel.create(req.body);
    res.json({msg:"Book added"})
  } catch (error) {
    res.json({msg:"Something went wrong"})
  }
}



module.exports ={ getAllBooks , addBook}
