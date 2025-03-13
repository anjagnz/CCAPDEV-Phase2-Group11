const mongoose = require("mongoose");

const TimeSlotSchema = new mongoose.Schema({
    laboratoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory' },
    timeSlotId: { type: Number, required: true },
    seatNumber: { type: Number, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    isAvailable: { type: Boolean, required: true}
});

const TimeSlot = mongoose.model("TimeSlot", TimeSlotSchema);

module.exports = TimeSlot