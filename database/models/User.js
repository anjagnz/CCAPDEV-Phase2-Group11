const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    type: { type: String, default: "Student", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    image: { type: String, default: "/img/default-profile.png" },
    email: { type: String, required: true },
    password: {type: String, required: true },
    biography: { type: String, default: "No biography provided yet." },
    department: { type: String, default: "N/A" },
})

const User = mongoose.model('User', PostSchema)

module.exports = User