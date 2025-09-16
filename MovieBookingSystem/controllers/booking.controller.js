const bookingModel = require("../models/booking.model");

// fetching all bookings
async function getAllBookings(req,res){
    try {
        let bookings = await bookingModel.find();
        res.json(bookings);
    } catch (error) {
        res.json({msg: "Something went wrong"});
    }
}

// adding new Booking
async function addNewBooking(req,res){
    try {
        await bookingModel.create(req.body);
        res.json({msg:"Booking added."})
    } catch (error) {
        res.json({msg:"Something went wrong"});
    }
}

module.exports = { getAllBookings, addNewBooking}