const mongoose = require("mongoose");

const LaboratorySchema = new mongoose.Schema({
    laboratoryId: { type: Number, required: true },
    laboratoryName: { type: String, required: true },
    capacity: { type: Number, required: true },
});

const Laboratory = mongoose.model("Laboratory",LaboratorySchema);

module.exports = Laboratory