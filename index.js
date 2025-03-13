const express = require("express");
const app = new express();
const bodyParser = require("body-parser");
const { engine } = require("express-handlebars");
const fileUpload = require('express-fileupload')
const cron = require("node-cron");

const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost/LabMateDB')

app.use(express.urlencoded({ extended : true}));
app.engine("hbs", engine({ extname: ".hbs", defaultLayout: "main"}))
app.set("view engine", "hbs");

const path = require("path");
const Reservation = require('./database/models/Reservation');
const Laboratory = require("./database/models/Laboratory");
const TimeSlot = require("./database/models/TimeSlot");
const User = require("./database/models/User");

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // files consist of more than strings
//app.use(bodyParser.urlencoded({ extended: false })); https://stackoverflow.com/questions/47232187/express-json-vs-bodyparser-json
app.use(fileUpload());

/*** RESERVATIONS ***/

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

// Edit a specific reservation
app.patch("/api/reservation/:id", async(req,res) => {
    try{
        const reservation = await Reservation.findByIdAndUpdate(req.params.id, {$set: req.body}, {new: true});
        if (!reservation){
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

// Initial Database Population
async function populateLaboratories() {
    const labsFound = await Laboratory.find();
    
    if(labsFound.length === 0) {
        const labs = [
            { laboratoryId: 1, laboratoryName: "GK404B", capacity: 20 },
            { laboratoryId: 2, laboratoryName: "AG1904", capacity: 40 },
            { laboratoryId: 3, laboratoryName: "GK201A", capacity: 20 },
            { laboratoryId: 4, laboratoryName: "AG1706", capacity: 40 },
            { laboratoryId: 5, laboratoryName: "GK302A", capacity: 20 }
        ];

        await Laboratory.insertMany(labs);
    }
}

// Initial Timeslot Population

// !!! WILL CONTINUE AFTER IMPLEMENTING CRON SCHEDULING

/* 
async function populateTimeSlots() {
    const timeSlotsFound = await TimeSlots.find();
    const labs = await Laboratory.find();

    const startTime = new Date();
    startTime.setHours(7, 30, 0, 0);

    const endTime = new Date();
    endTime.setHours(21, 0, 0, 0);

    if((timeSlotsFound.length === 0)) {
        const timeSlots = []
        
        for(let i = 0; i < labs.length; i++)
        {
            for(let j = 1; j <= labs[i].capacity; j++)
            {
                for(let time = new Date(startTime); time <= endTime; time.setMinutes(time.getMinutes() + 30))
                {
                    const timeSlot = {
                        laboratoryId: labs[i].laboratoryId,
                        timeSlotId: --,
                        seatNumber: j,
                        date: --,
                        time: time.toTimeString().slice(0, 5),
                        isAvailable: true
                    };

                    timeSlots.push(timeSlot);
                }
            }
        }

        await TimeSlot.insertMany(timeSlots);
    }
}*/



/*** USERS ***/


// request for form submission 
app.get("/signin-page", (req,res) => {
    // TODO: for sessions MCO3
})

// Sign in submission
app.post("/signin-page", express.urlencoded({extended: true}), (req,res) => {
    const {email, password, rememberUser} = req.body;
    
    // search user credentials in db
    // if exist, correct password -> homepage
    // else, error in form

    // hardcoded details
    if (email === "the_goat@dlsu.edu.ph" && password === "admin" ) {
        // direct session to this user
        res.redirect("/student-home")
    } else {
        res.send("INVALID! </a>");
    }
    res.send("Login: " + email + " " + password +" " + rememberUser)
})

// Initial users
async function populateUsers() {
    const existingUsers = await User.find();
    
    if(existingUsers.length === 0) {
        const users = [
            { userId: 1, type: "Student", firstName: "Denise Liana", lastName: "Ho", image:"img/demo_data/sonoda.jpg", email: "denise_liana_ho@dlsu.edu.ph", password: "123", biography: "idk stream tsunami sea yeah", department: "Computer Science" },
            { userId: 2, type: "Student", firstName: "Anja", lastName: "Gonzales", email: "anja_gonzales@dlsu.edu.ph", password: "234", biography: "i need sleep", department: "Computer Science" },
            { userId: 3, type: "Student", firstName: "Angelo", lastName: "Rocha", email: "angelo_rocha@dlsu.edu.ph", password: "345", biography: "idk what to put here", department: "Computer Science" },
            { userId: 4, type: "Student", firstName: "Grass", lastName: "Capote", email: "mary_grace_capote@dlsu.edu.ph", password: "456", biography: "send help", department: "Computer Science" },
            { userId: 5, type: "Faculty", firstName: "The", lastName: "Goat", email: "the_goat@dlsu.edu.ph", password: "admin", department:"Computer Science" },
        ];

        await User.insertMany(users);
    }
}

populateLaboratories();
populateUsers();

app.listen(3000, () => {
    console.log("Node server running at http://localhost:3000");
});
