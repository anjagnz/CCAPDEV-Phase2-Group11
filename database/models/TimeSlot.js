const mongoose = require("mongoose");

const TimeSlotSchema = new mongoose.Schema({
    laboratoryRoom: { type: String, required: true },
    seatNumber: { type: Number, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    isAvailable: { type: Boolean, required: true},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const TimeSlot = mongoose.model("TimeSlot", TimeSlotSchema);

module.exports = TimeSlot