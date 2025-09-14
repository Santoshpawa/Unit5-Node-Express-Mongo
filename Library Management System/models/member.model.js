const mongoose = require("mongoose");

const memberSchema =  mongoose.Schema({
    name : {type: String, required:true},
    email : {type:String, unique:[true,"Email Should be unique"], required:true},
    booksBorrowed : [{type: mongoose.Schema.ObjectId, ref:"books"}]
})

const memberModel = mongoose.model("members", memberSchema);

module.exports = memberModel;