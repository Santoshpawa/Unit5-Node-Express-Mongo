const fs = require("fs");

// fetching
function getData() {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf8"));
  return data;
}

//savedata
function saveData(data) {
  fs.writeFileSync("./db.json", JSON.stringify(data));
}

module.exports = { getData, saveData };
