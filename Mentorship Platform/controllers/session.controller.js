const sessionModel = require("../models/session.model");

// adding a new session
async function addSession(req, res) {
  try {
    await sessionModel.create(req.body);
    res.json({ msg: "Session created" });
  } catch (error) {
    resljson({ msg: "Something went wrong" });
  }
}


// fetching all session
async function getAllSession(req,res){
    try {
        let sessions = await sessionModel.find();
        res.json(sessions);
    } catch (error) {
        res.json({msg:"Something went wrong"});
    }
}

module.exports = { addSession, getAllSession };
