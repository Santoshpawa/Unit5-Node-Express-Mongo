const mongoose = require("mongoose");

async function connectToDb() {
  try {
    await mongoose.connect(process.env.Mongo_URL);
    console.log("Connected to database");
  } catch (error) {
    console.log("Could not connect to database");
  }
}

module.exports = connectToDb;
