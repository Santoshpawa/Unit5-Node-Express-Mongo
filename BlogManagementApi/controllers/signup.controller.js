const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");
const saltRound = 10;



// storing the data of user during signup
async function signupController(req,res){
    try {
        let {name, email, password} = req.body;
        bcrypt.hash(password, saltRound, async function(err,hash){
            await userModel.create({name,email,password:hash});
        })
        res.json({msg:"User signedup successfully."});
    } catch (error) {
        res.json({msg: "Something went wrong"});
    }
}

module.exports = {signupController}