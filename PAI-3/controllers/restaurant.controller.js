const restaurantModel = require("../models/restaurant.model");

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

// get restaurant with id


module.exports = { getAllRestaurant , addNewRestaurant};
