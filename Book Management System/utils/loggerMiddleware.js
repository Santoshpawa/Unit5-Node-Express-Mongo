const fs = require("fs");

function loggerMiddleware(req, res, next) {
  let data = JSON.parse(fs.readFileSync("./requestLog.json", "utf8"));
  let newLog = {
    url: req.url,
    method: req.method,
    time: new Date().toString(),
  };
  data.push(newLog);
  fs.writeFileSync("./requestLog.json", JSON.stringify(data));
  next();
}

module.exports = loggerMiddleware;
