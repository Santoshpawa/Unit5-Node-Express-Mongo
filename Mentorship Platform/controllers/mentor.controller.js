const mentorModel = require("../models/mentor.model");



// adding mentor
async function addMentor(req,res){
    try {
        await mentorModel.create(req.body);
        res.json({msg: "Mentor added."})
    } catch (error) {
        res.json({msg: "Something went wrong"})
    }
}

//fetching all mentor
async function getAllMentor(req,res){
    try {
        let mentors = await mentorModel.find();
        res.json(mentors);
    } catch (error) {
        res.status(500).json({msg: "Something went wrong"});
    }
}

module.exports = {addMentor, getAllMentor}