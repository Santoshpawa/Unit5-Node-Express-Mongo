const mongoose = require("mongoose");

const consultationSchema = mongoose.Schema({
    title : {type:String, required:true},
    patientssId : [{type: mongoose.Schema.ObjectId, ref:"learner"}] ,
    doctorId : {type: mongoose.Schema.ObjectId, ref: "mentor"},
})

const consultationModel = mongoose.model("session", consultationSchema);

module.exports = consultationModel;