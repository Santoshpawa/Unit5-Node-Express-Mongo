const mongoose = require("mongoose");

async function connectToDb(){
    try {
        await mongoose.connect(process.env.Mongo_URL);
        console.log("Connected to DB");
    } catch (error) {
        console.log("Could not connect to DB");
    }
}

module.exports = connectToDb;