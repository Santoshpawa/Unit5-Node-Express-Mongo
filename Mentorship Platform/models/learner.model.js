const mongoose = require("mongoose");

const learnerSchema = mongoose.Schema({
    name: {type:String, required: true},
    email: {type: String, required: true, unique: true, match:/^\S+@\S+\.\S+$/}
})

const learnerModel = mongoose.model("learner", learnerSchema);

module.exports = learnerModel;