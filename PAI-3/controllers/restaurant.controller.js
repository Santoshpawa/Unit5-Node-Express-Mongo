const restaurantModel = require("../models/restaurant.model");
const reviewModel = require("../models/review.modle");

// fetching all restaurants details
async function getAllRestaurant(req, res) {
  try {
    let restaurants = await restaurantModel.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
}

// add a new restaurant
async function addNewRestaurant(req, res) {
  try {
    await restaurantModel.create(req.body);
    res.json({ msg: "Restaurant added." });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
}

// updating a restaurant by id
async function updateRestaurantById(req, res) {
  try {
    let restaurant = await restaurantModel.findById(req.params.id);
    if (!restaurant) {
      res.status(400).json({ msg: "Restaurant with this id is not present" });
      return;
    }
    await restaurantModel.findByIdAndUpdate(req.params.id, req.body);

    res.json({ msg: "Restaurant details updated successfully." });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
}

// get restaurant with id
async function getRestaurantById(req, res) {
  try {
    let restaurant = await restaurantModel.findById(req.params.id);
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
}

// adding a review
async function addReview(req, res) {
  try {
    let restId = req.params.id;

    await reviewModel.create(req.body);
    let restaurant = await restaurantModel.findById(restId);
    let reviews = await reviewModel.find({ restaurant: restId });
    let count = 0; // for counting total reviews
    let totalRating = 0; // for adding all ratings
    reviews.forEach((ele) => {
      totalRating += ele.rating;
      ++count;
    });
    let avg = (totalRating / count).toFixed(2);
    restaurant.averageRating = avg;
    await restaurant.save();

    res.json({ msg: "Review added successfully" });
  } catch (error) {
    res.json({ msg: "Something went wrong" });
  }
}

// fetch all the reviews of a restaurant
async function getAllReviewsByRestaurantId(req, res) {
  try {
    let restId = req.params.id;
    let reviews = await reviewModel.find({ restaurant: restId });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
}

// delete review by id
async function deleteReviewById(req, res) {
  try {
    let review = await reviewModel.findById(req.params.id);
    let restId = review.restaurant;
    await reviewModel.findByIdAndDelete(req.params.id);
    let totalRating = 0; // recalculation total rating
    let count = 0;
    let reviews = await reviewModel.find({ restaurant: restId });
    let restaurant = await restaurantModel.findById(restId);
    reviews.forEach((ele) => {
      totalRating += ele.rating;
      ++count;
    });
    let avg = (totalRating / count).toFixed(2);
    restaurant.averageRating = avg;
    await restaurant.save();
    res.json({ msg: "Review deleted successfully and rating updated." });
  } catch (error) {
    res.json({msg:"Something went wrong."})
  }
}

module.exports = {
  getAllRestaurant,
  addNewRestaurant,
  getRestaurantById,
  updateRestaurantById,
  addReview,
  getAllReviewsByRestaurantId,
  deleteReviewById,
};
