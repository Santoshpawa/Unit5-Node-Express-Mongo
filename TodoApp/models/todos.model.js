const fs = require("fs");

function getData() {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  return data;
}

function saveData(data) {
  fs.writeFileSync("./db.json", JSON.stringify(data));
}

module.exports = { getData, saveData };
