const mongoose = require("mongoose");

const sessionSchema = mongoose.Schema({
    title : {type:String, required:true},
    learnersId : [{type: mongoose.Schema.ObjectId, ref:"learner"}] ,
    mentorId : {type: mongoose.Schema.ObjectId, ref: "mentor"},
})

const sessionModel = mongoose.model("session", sessionSchema);

module.exports = sessionModel;