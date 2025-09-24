const jwt = require("jsonwebtoken");

async function authMiddleware(req,res,next){
    try {
        let token = req.headers.authorization.split(' ')[1];
        let decoded = jwt.verify(token, process.env.SecretKey);
        req.userId = decoded.userId;
        next();
        
    } catch (error) {
        res.json("Something went wrong in auto middelware")
        console.log(error)
    }
}

module.exports = authMiddleware;