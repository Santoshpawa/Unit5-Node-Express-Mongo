const learnerModel = require("../models/learner.model");



// adding learner
async function addLearner(req, res) {
  try {
    await learnerModel.create(req.body);
    res.json({ msg: "Learner added." });
  } catch (error) {
    res.json({ msg: "Something went wrong" });
    console.log(error)
  }
}

// fetching all learner
async function getAllLearner(req,res){
    try {
        let learners = await learnerModel.find();
        res.json(learners);
    } catch (error) {
        res.json({msg: "Something went wrong"});
    }
}


module.exports = {addLearner, getAllLearner};