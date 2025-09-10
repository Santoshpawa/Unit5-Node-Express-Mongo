const mongoose = require("mongoose");

async function connectToDb() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/tasks");
    console.log("Connected to database");
  } catch (error) {
    console.log("Could not connect to database");
  }
}

module.exports = connectToDb;
