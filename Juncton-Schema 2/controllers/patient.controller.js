const patientModel = require("../models/patient.model");



// adding learner
async function addPatient(req, res) {
  try {
    await patientModel.create(req.body);
    res.json({ msg: "Patient added." });
  } catch (error) {
    res.json({ msg: "Something went wrong" });
    console.log(error)
  }
}

// fetching all learner
async function getAllPatient(req,res){
    try {
        let patients = await learnerModel.find();
        res.json(patients);
    } catch (error) {
        res.json({msg: "Something went wrong"});
    }
}


module.exports = {addPatient, getAllPatient};