const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    title: {type:String, required: true},
    author: {type: String, required:true},
    status:{type:String, enum :["borrowed" , "available"], default: "available"},
    borrower : {type: mongoose.Schema.ObjectId, ref: "members"},
})

const bookModel = mongoose.model("books", bookSchema);

module.exports = bookModel;