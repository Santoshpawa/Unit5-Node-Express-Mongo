const consultationModel = require("../models/consultation.model");

// adding a new session
async function addConsultation(req, res) {
  try {
    await consultationModel.create(req.body);
    res.json({ msg: "Consultation created" });
  } catch (error) {
    resljson({ msg: "Something went wrong" });
  }
}


// fetching all session
async function getAllConsultation(req,res){
    try {
        let consultation = await consultationModel.find();
        res.json(consultation);
    } catch (error) {
        res.json({msg:"Something went wrong"});
    }
}

module.exports = { addConsultation, getAllConsultation};
