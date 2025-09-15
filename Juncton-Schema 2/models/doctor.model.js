const mongoose = require("mongoose");

const doctorSchema = mongoose.Schema({
    name : {type: String, required: true},
    email : {type: String, required:true, unique: true, match: /^\S+@\S+\.\S+$/},

})

const doctorModel = mongoose.model("mentor", doctorSchema);

module.exports = doctorModel;