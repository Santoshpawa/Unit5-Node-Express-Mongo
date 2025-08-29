const { fileReading, appendingFile } = require("./fileoperations.js");

async function fileoperations() {
  console.log("Initial Content of file:");
  await fileReading();
  console.log("Appending new text...");
  await appendingFile("This is a new line");
  console.log("Updated content of the file.");
  await fileReading();
}
fileoperations();