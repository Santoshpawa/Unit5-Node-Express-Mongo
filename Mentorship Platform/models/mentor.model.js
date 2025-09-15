const mongoose = require("mongoose");

const mentorSchema = mongoose.Schema({
    name : {type: String, required: true},
    email : {type: String, required:true, unique: true, match: /^\S+@\S+\.\S+$/},

})

const mentorModel = mongoose.model("mentor", mentorSchema);

module.exports = mentorModel;