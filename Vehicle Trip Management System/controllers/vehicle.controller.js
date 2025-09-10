const VehicleModel = require("../models/vehicle.model");

// fetching all vehicles details
async function getAllVehicles(req, res) {
  try {
    let vehicles = await VehicleModel.find();
    res.json(vehicles);
  } catch (error) {
    res.json({ msg: "Something went wrong." });
  }
}

// add vehicle
async function addVehicle(req, res) {
  try {
    await VehicleModel.create(req.body);
    res.json({ msg: "New Vehicle added" });
  } catch (error) {
    res.json({ msg: "Something went wrong" });
  }
}

// updating vehicle information by id
async function updateVehicleById(req, res) {
  try {
    let id = req.params.id;
    let vehicle = await VehicleModel.findById(id);
    await VehicleModel.findByIdAndUpdate(id, req.body);
    res.json({ msg: "Vehicles details updated" });
  } catch (error) {
    res.json({ msg: "Something went wrong." });
  }
}

//delete vehicle by id
async function deleteVehicleById(req, res) {
  try {
    let id = req.params.id;
    await VehicleModel.findByIdAndDelete(id);
    res.json({ msg: "Vehicle deleated Successfully" });
  } catch (error) {
    res.json({ msg: "Something went wrong." });
  }
}

//adding a new trip
async function addNewTrip(req, res) {
  try {
    let id = req.params.id;
    let [vehicle] = await VehicleModel.find({ _id: id });
    vehicle.trips.push(req.body);
    await vehicle.save();
    res.json({ msg: "New trip added" });
  } catch (error) {
    res.json({ msg: "Something went wrong" });
  }
}

// update trip by index
async function updateTripById(req, res) {
  try {
    let vehicleId = req.params.id;
    let tripId = req.params.trip;
    let vehicle = await VehicleModel.findById(vehicleId);
    console.log(vehicle);
    vehicle.trips = vehicle.trips.map((trip) => {
      if (trip._id == tripId) {
        Object.assign(trip, req.body);
        return trip;
      } else {
        return trip;
      }
    });
    await vehicle.save();
    res.json({ msg: "Trip updated successfully" });
  } catch (error) {
    res.json({ msg: "Something went wrong" });
    console.log(error);
  }
}

//delete a trip
async function deleteATrip(req, res) {
  try {
    let vehicleId = req.params.id;
    let tripId = req.params.trip;
    let vehicle = await VehicleModel.findById(vehicleId);

    vehicle.trips = vehicle.trips.filter((trip) => trip._id != tripId);
    await vehicle.save();
    res.json({ msg: "Trip updated successfully" });
  } catch (error) {
    res.json({ msg: "Something went wrong" });
    console.log(error);
  }
}

//some analysis as asked by the question
async function analysis1(req, res) {
  try {
    let vehicles = await VehicleModel.find(
      { "trips.distance": { $gte: 200 } },
      { registrationNumber: 1, model: 1 }
    );
    res.json(vehicles);
  } catch (error) {
    res.json({ msg: "Something went wrong" });
  }
}

async function analysis2(req, res) {
  try {
    let vehicles = await VehicleModel.find(
      { "trips.startLocation": { $in: ["Delhi", "Mumbai", "Banglore"] } },
      { registrationNumber: 1, model: 1 }
    );
    res.json(vehicles);
  } catch (error) {
    res.json({ msg: "Something went wrong" });
  }
}

async function analysis3(req, res) {
  try {
    let vehicles = await VehicleModel.find(
      { "trips.startTime": { $gt: new Date("2024-01-01") } },
      { registrationNumber: 1, model: 1 }
    );
    res.json(vehicles);
  } catch (error) {
    res.json({ msg: "Something went wrong" });
  }
}

async function analysis4(req, res) {
  try {
    let vehicles = await VehicleModel.find(
      { type: { $in: ["car", "truck"] } },
      { registrationNumber: 1, model: 1 }
    );
    res.json(vehicles);
  } catch (error) {
    res.json({ msg: "Something went wrong" });
  }
}

// total distance
async function totalDistanceById(req, res) {
  try {
    let vehicleId = req.params.id;

    let vehicle = await VehicleModel.findById(vehicleId);
    let totalDistance = 0;
    vehicle.trips.forEach((trip) => (totalDistance += trip.distance));
    await vehicle.save();
    res.json({
      msg: `Total Distance covered by this vehicle is: ${totalDistance}`,
    });
  } catch (error) {
    res.json({ msg: "Something went wrong" });
    console.log(error);
  }
}

module.exports = {
  getAllVehicles,
  addVehicle,
  updateVehicleById,
  deleteVehicleById,
  addNewTrip,
  updateTripById,
  deleteATrip,
  analysis1,
  analysis2,
  analysis3,
  analysis4,
  totalDistanceById
};
