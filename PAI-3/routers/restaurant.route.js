const express = require("express");
const { getAllRestaurant, addNewRestaurant, getRestaurantById, updateRestaurantById, addReview, getAllReviewsByRestaurantId, deleteReviewById } = require("../controllers/restaurant.controller");

const restaurantsRouter = express.Router();

// fetching all restaurants
restaurantsRouter.get("/", getAllRestaurant);

// add new restaurant
restaurantsRouter.post("/", addNewRestaurant);

// get restaurant with id
restaurantsRouter.get("/:id", getRestaurantById);

// update restaurant with id
restaurantsRouter.patch("/:id", updateRestaurantById);



//for reviews
//addding review 
restaurantsRouter.post("/:id/reviews", addReview);

// geting all reviews
restaurantsRouter.get("/:id/reviews", getAllReviewsByRestaurantId);

// delete review
restaurantsRouter.delete("/reviews/:id", deleteReviewById);



module.exports = restaurantsRouter;