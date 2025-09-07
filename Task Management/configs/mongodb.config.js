const mongoose = require("mongoose");

async function connectToDb() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/TaskDB");
    console.log("Connected to Database");
  } catch (error) {
    console.log("Error in connection to DB");
  }
}

module.exports = connectToDb;
