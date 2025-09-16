const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    name : {type: String, required: true},
    email:{type: String, required: true, unique: true, match : /^\S+@\S+\.\S+$/},
    joinedAt: Date,
})

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;