const express = require("express");
const { getAllMovies, addNewMovie } = require("../controllers/movie.controller");

const movieRouter = express.Router();


//fetching all files
movieRouter.get("/", getAllMovies);

//adding new movie
movieRouter.post("/", addNewMovie);

module.exports = movieRouter;