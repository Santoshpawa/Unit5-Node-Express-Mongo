const mongoose = require("mongoose");

const tripSchema = mongoose.Schema({
      startLocation: { type: String, required: true},
      endLocation: { type:String, required: true},
      distance: { type: Number ,required: true, min: 0},
      startTime: {type: Date ,required: true},
      endTime: { type:Date , required: true}
    })

const vehicleSchema = mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true},
  type: { type:String,  enum: ['car', 'truck', 'bike'], required: true},
  model: { type: String, required: true},
  isActive: { type: Boolean, default: true},
  trips: [tripSchema]
})

const VehicleModel = mongoose.model("vehicle",vehicleSchema);

module.exports = VehicleModel;