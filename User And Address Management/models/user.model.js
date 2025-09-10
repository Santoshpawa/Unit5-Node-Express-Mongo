const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
    street: {type: String, required: true},
    city:{type: String, required: true},
    state: {type: String, required: true},
    country : {type: String, required: true, default : "India"},
    pincode : {type: Number, required: true}
})

const userSchema = mongoose.Schema({
    name : {type: String, required: true},
    email : {type: String, required: true, lowerecase: true, unique : true, immutable: true, match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"] },
    age : {type : Number, min : 7, max: 120},
    address : [addressSchema]
})

const UserModel = mongoose.model("Users", userSchema);

module.exports = UserModel;
