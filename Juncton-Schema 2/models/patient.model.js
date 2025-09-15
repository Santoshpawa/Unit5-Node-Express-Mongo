const mongoose = require("mongoose");

const patientSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^\S+@\S+\.\S+$/,
  },
});

const patientModel = mongoose.model("learner", patientSchema);

module.exports = patientModel;
