const jwt = require("jsonwebtoken");

async function authMiddleware(req, res, next) {
  try {
    let token = req.headers.authorization.split(" ")[1];
    if(!token){
        return res.json({msg:"No token found"});
    }
    
    var decoded = jwt.verify(token, "alphabeta");
    req.user = decoded.userId;    
    next();
  } catch (error) {
    res.json({msg: "Invalid token"})
  }
}

module.exports = authMiddleware;
