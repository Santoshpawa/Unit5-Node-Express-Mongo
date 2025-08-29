const fs = require("fs").promises;
const path = "./data.txt";

async function fileReading() {
  try {
    await fs.access(path);
  } catch (error) {
    console.log("File doesn't exist. Creating new file...");
    await fs.writeFile(path, "");
  }

  data = await fs.readFile(path, "ascii");
  if (data.trim() !== "") {
    console.log(data);
  } else {
    console.log("File does not contain any text.");
  }
}

async function appendingFile(newText) {
  try {
    await fs.access(path);
  } catch (error) {
    console.log("File doesn't exist. Creating new file...");
    await fs.writeFile(path, "");
  }
  let data = await fs.readFile(path, "utf-8");
  if (data.trim() == "") {
    await fs.appendFile(path, newText);
  } else {
    await fs.appendFile(path, `\n${newText}`);
  }
}

module.exports = { fileReading, appendingFile };
