const mongoose = require("mongoose");

const movieSchema = mongoose.Schema({
    title : {type: String, required: true, unique:true},
    genre: {type: String, required: true},
    releaseYear : {type: Number},
    durationMins :{type: Number}
})

const movieModel = mongoose.model("movies", movieSchema);

module.exports = movieModel;