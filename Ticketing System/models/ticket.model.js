const fs = require("fs");

//fetching data

function getData() {
  let data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  return data;
}

// saving the data
function saveData(data) {
  fs.writeFileSync("./db.json", JSON.stringify(data));
}

module.exports = { getData, saveData };
