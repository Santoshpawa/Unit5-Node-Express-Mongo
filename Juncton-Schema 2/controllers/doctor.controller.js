const doctorModel = require("../models/doctor.model");



// adding mentor
async function addDoctor(req,res){
    try {
        await doctorModel.create(req.body);
        res.json({msg: "Doctor added."})
    } catch (error) {
        res.json({msg: "Something went wrong"})
    }
}

//fetching all mentor
async function getAllDoctor(req,res){
    try {
        let doctors = await mentorModel.find();
        res.json(doctors);
    } catch (error) {
        res.status(500).json({msg: "Something went wrong"});
    }
}

module.exports = {addDoctor, getAllDoctor}