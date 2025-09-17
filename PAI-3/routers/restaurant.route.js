const express = require("express");
const { getAllRestaurant, addNewRestaurant } = require("../controllers/restaurant.controller");

const restaurantsRouter = express.Router();

// fetching all restaurants
restaurantsRouter.get("/", getAllRestaurant);

// add new restaurant
restaurantsRouter.post("/", addNewRestaurant);

// get restaurant with id
restaurantsRouter.post("/:id", getRestaurantById);


module.exports = restaurantsRouter;