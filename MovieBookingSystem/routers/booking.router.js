const express = require("express");
const { getAllBookings, addNewBooking } = require("../controllers/booking.controller");

const bookingRouter = express.Router();


//fetching all files
bookingRouter.get("/", getAllBookings);

//adding new booking
bookingRouter.post("/", addNewBooking);

module.exports = bookingRouter;