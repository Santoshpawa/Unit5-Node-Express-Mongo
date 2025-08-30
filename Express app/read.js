const fs = require("fs");

function fileReading(name) {
  const path = `./${name}.txt`;
  if (!fs.existsSync(path)) {
    return "File does not exist";
  }
  let data = fs.readFileSync(path, "utf-8");
  return data;
}

module.exports = fileReading;
