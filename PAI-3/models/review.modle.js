const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema({
    text : {type: String, required:true, min: 10},
    rating : {type: Number, required : true, min: 1, max:5},
    restaurant: {type: mongoose.Schema.ObjectId, required: true},
})




