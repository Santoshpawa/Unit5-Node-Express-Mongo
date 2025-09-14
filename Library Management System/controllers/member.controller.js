const bookModel = require("../models/book.model");
const memberModel = require("../models/member.model");
const { getAllBooks } = require("./book.controller");



// fetching all member details
async function getAllMembers(req,res){
    try {
        let members = await memberModel.find();
        res.json(members);
    } catch (error) {
        res.status(500).json({msg:"Something went wrong"})
    }
}

//adding new members
async function addMembers(req,res){
    try {
        await memberModel.create(req.body);
        res.json({msg:"Member added"});
    } catch (error) {
        res.json({msg:"Something went wrong", error})
    }
}

// borrowing a book
async function borrowingBook(req,res){
    try {
        let {memberId, bookId} = req.params;
        let member = await memberModel.findById({_id:memberId});
        if(!member){
            res.json({msg: "Member id not found"});
            return;
        }
        let book = await bookModel.findById({_id: bookId});
        if(!book){
            res.json({msg:"Book id not found"});
            return;
        }
        if(book.status == "borrowed"){
            res.json({msg: "Book already issued"});
            return;
        }
        
        member.booksBorrowed.push(bookId);
        book.borrower = memberId;
        book.status = "borrowed";
        await book.save();
        await member.save();
        res.json({msg:"Book issued"});
    } catch (error) {
        res.json({msg:"Something went wrong"});
    }
}


// returning a book
async function returningBook(req,res){
    try {
        let {memberId, bookId} = req.params;
        let member = await memberModel.findById({_id:memberId});
        if(!member){
            res.json({msg: "Member id not found"});
            return;
        }
        let book = await bookModel.findById({_id: bookId});
        if(!book){
            res.json({msg:"Book id not found"});
            return;
        }
      
        
        member.booksBorrowed = member.booksBorrowed.filter((ele)=> ele !=bookId);
        book.borrower = null;
        book.status = "available";
        await book.save();
        await member.save();
        res.json({msg:"Book returned"});
    } catch (error) {
        res.json({msg:"Something went wrong"});
    }
}

// getting all books
async function getAllIssuedBooks(req,res){
    try {
      
        let {memberId} = req.params;
        let books = await memberModel.findById(memberId).populate("booksBorrowed",{title:1, _id:0,author:1});
      
        res.json(books);
    } catch (error) {
        res.json({msg:"Something went wrong"});
    }
}

module.exports = {getAllMembers, addMembers, borrowingBook, returningBook, getAllIssuedBooks}