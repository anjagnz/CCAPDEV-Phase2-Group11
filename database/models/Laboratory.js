const mongoose = require("mongoose");

const LaboratorySchema = new mongoose.Schema({
    laboratoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory' },
    laboratoryName: { type: String, required: true },
    capacity: { type: Number, required: true },
});

const Laboratory = mongoose.model("Laboratory",LaboratorySchema);

module.exports = Laboratory