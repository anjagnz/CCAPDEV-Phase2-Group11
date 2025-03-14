const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    studentName: {type: String}, // optional (for reservations made by the labtech). 
    laboratoryRoom: { type: String, required: true },
    seatNumber: { type: Number, required: true },
    bookingDate: { type: Date, required: true }, // booking time can be extracted from this
    reservationDate: { type: Date, required: true }, 
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false } // Whether the reservation should be shown anonymously
});

const Reservation = mongoose.model("Reservation", ReservationSchema);

module.exports = Reservation