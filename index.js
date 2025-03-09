const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost/LabMateDB')

const Reservation = require('./database/models/Reservation');
const path = require("path");

app.use(express.json()) 
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// Get all reservations
app.get("/api/reservations", async(req,res) => {
    try{
        const reservations = await Reservation.find();
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
})

// Get a specific reservation
app.get("/api/reservations/:id", async(req,res) => {
    try{
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        res.json(reservation); 
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
})

// Delete a specific reservation
app.delete("/api/reservations/:id", async(req,res) => {
    try{
        const reservation = await Reservation.findByIdAndDelete(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }   
        res.json(reservation);  
    } catch (error){
        res.status(500).json({ message: "Server error", error });
    }
})

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html"))); 
app.get("/signup-page", (req, res) => res.sendFile(path.join(__dirname, "signup-page.html"))); 
app.get("/signin-page", (req, res) => res.sendFile(path.join(__dirname, "signin-page.html")));
app.get("/student-home", (req, res) => res.sendFile(path.join(__dirname, "student-home.html"))); 
app.get("/student-laboratories", (req, res) => res.sendFile(path.join(__dirname, "student-laboratories.html")));
app.get("/signedout-lab", (req, res) => res.sendFile(path.join(__dirname, "signedout-laboratories.html"))); 

// Demo Profiles
app.get("/demo-profile1", (req, res) => res.sendFile(path.join(__dirname, "demo_profile1.html")));
app.get("/demo-profile2", (req, res) => res.sendFile(path.join(__dirname, "demo_profile2.html")));
app.get("/demo-profile3", (req, res) => res.sendFile(path.join(__dirname, "demo_profile3.html")));
app.get("/demo-profile4", (req, res) => res.sendFile(path.join(__dirname, "demo_profile4.html")));
app.get("/labtech-demo-profile1", (req, res) => res.sendFile(path.join(__dirname, "labtech_demo_profile1.html")));
app.get("/labtech-demo-profile2", (req, res) => res.sendFile(path.join(__dirname, "labtech_demo_profile2.html")));
app.get("/labtech-demo-profile3", (req, res) => res.sendFile(path.join(__dirname, "labtech_demo_profile3.html")));
app.get("/labtech-demo-profile4", (req, res) => res.sendFile(path.join(__dirname, "labtech_demo_profile4.html")));

// Labtech Pages
app.get("/labtech-home", (req, res) => res.sendFile(path.join(__dirname, "labtech-home.html")));
app.get("/labtech-laboratories", (req, res) => res.sendFile(path.join(__dirname, "labtech-laboratories.html")));
app.get("/labtech-profile-overview", (req, res) => res.sendFile(path.join(__dirname, "labtech-profile_overview.html")));
app.get("/labtech-profile-edit", (req, res) => res.sendFile(path.join(__dirname, "labtech-profile_edit.html")));
app.get("/labtech-profile-delete", (req, res) => res.sendFile(path.join(__dirname, "labtech-profile_delete.html")));
app.get("/labtech-profile-account", (req, res) => res.sendFile(path.join(__dirname, "labtech-profile_accountOverview.html")));
app.get("/labtech-reservations", (req, res) => res.sendFile(path.join(__dirname, "labtech-reservations.html")));

// Student Profile Pages
app.get("/profile-overview", (req, res) => res.sendFile(path.join(__dirname, "profile_overview.html")));
app.get("/profile-edit", (req, res) => res.sendFile(path.join(__dirname, "profile_edit.html")));
app.get("/profile-delete", (req, res) => res.sendFile(path.join(__dirname, "profile_delete.html")));
app.get("/profile-account", (req, res) => res.sendFile(path.join(__dirname, "profile_accountOverview.html")));

// Reservations
app.get("/see-reservations", (req, res) => res.sendFile(path.join(__dirname, "see-reservations.html")));

app.listen(3000, () => {
    console.log("Node server running at http://localhost:3000");
});
