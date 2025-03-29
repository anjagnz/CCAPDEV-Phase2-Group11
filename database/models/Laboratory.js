const mongoose = require("mongoose");

const LaboratorySchema = new mongoose.Schema({
    hall: {type: String, required: true},
    room: { type: String, required: true },
    capacity: { type: Number, required: true },
});

const Laboratory = mongoose.model("Laboratory", LaboratorySchema);

module.exports = Laboratory