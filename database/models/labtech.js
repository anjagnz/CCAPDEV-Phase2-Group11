const mongoose = require('mongoose')

const LabTechSchema = new mongoose.Schema({
    type: { type: String, default: 'Faculty', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    image: { type: String, default: "/img/default-profile.png" },
    email: { type: String, required: true },
    password: {type: String, required: true },
    biography: { type: String, default: "No biography provided yet." },
    department: { type: String, default: "N/A" },
    laboratories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory' }]
})

const LabTech = mongoose.model('LabTech', LabTechSchema)

module.exports = LabTech
