const express = require("express");
const { getAllVehicles, addVehicle, updateVehicleById, deleteVehicleById, addNewTrip, updateTripById, deleteATrip,  analysis1, analysis2, analysis3, analysis4, totalDistanceById } = require("../controllers/vehicle.controller");

const vehicleRouter = express.Router();

// fetching all vehicles details
vehicleRouter.get("/", getAllVehicles);

// adding new vehicle
vehicleRouter.post("/", addVehicle);

// update vehicle by id
vehicleRouter.patch("/:id", updateVehicleById);

// delete vehicle by Id
vehicleRouter.delete("/:id", deleteVehicleById);

// adding a trip
vehicleRouter.post("/:id/trip", addNewTrip);

// update a trip by id
vehicleRouter.patch("/:id/:trip", updateTripById);

//delete a trip
vehicleRouter.delete("/:id/:trip", deleteATrip);

// analysis
vehicleRouter.get("/analysis1", analysis1);

vehicleRouter.get("/analysis2", analysis2);
vehicleRouter.get("/analysis3", analysis3);
vehicleRouter.get("/analysis4", analysis4);

vehicleRouter.get("/:id/totalDistance", totalDistanceById);
module.exports = vehicleRouter;