const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema({
    userId: {type : mongoose.Schema.ObjectId, required: true},
    movieId : {type: mongoose.Schema.ObjectId, required: true},
    bookingDate: Date,
    seats : Number,
    statue : {type: String, enum : ["booked", "cancelled"], required: true}
})

const bookingModel = mongoose.model("bookings", bookingSchema);

module.exports = bookingModel;

