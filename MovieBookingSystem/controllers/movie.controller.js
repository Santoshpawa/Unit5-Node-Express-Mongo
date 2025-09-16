const movieModel = require("../models/movie.model");

// fetching all movies
async function getAllMovies(req,res){
    try {
        let movies = await movieModel.find();
        res.json(movies);
    } catch (error) {
        res.json({msg: "Something went wrong"});
    }
}

// adding new movie
async function addNewMovie(req,res){
    try {
        await movieModel.create(req.body);
        res.json({msg:"Movie added."})
    } catch (error) {
        res.json({msg:"Something went wrong"});
    }
}

module.exports = { getAllMovies, addNewMovie}