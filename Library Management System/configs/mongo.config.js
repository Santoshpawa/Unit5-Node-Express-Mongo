const mongoose = require("mongoose");

async function connectToDb(){
    try {
        await mongoose.connect(process.env.Mongo_URL);
        console.log("Connected to Db server");
    } catch (error) {
        console.log("Could not connect to Db server");
    }
}

module.exports = connectToDb;