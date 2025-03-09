const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    laboratoryRoom: { type: String, required: true },
    seatNumber: { type: Number, required: true },
    bookingDate: { type: Date, required: true }, 
    reservationDate: { type: Date, required: true }, 
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
});

const Reservation = mongoose.model("Reservation",ReservationSchema);

module.exports = Reservation