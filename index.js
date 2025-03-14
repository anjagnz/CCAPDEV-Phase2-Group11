const express = require("express");
const app = new express();
const bodyParser = require("body-parser");
// const { engine } = require("express-handlebars");
const fileUpload = require('express-fileupload')
const cron = require("node-cron");
const mongoose = require("mongoose");
const hbs = require("hbs")
const path = require("path");

//app.engine("hbs", engine({ extname: ".hbs", defaultLayout: "main"}))
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

mongoose.connect('mongodb://localhost/LabMateDB')
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

// Get reservations of a specific user
app.get("/api/reservations/user/:userId", async(req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        const reservations = await Reservation.find({ userId });
        if (!reservations || reservations.length === 0) {
            return res.status(404).json({ message: "No reservations found for this user" });
        }

        res.json(reservations);
    } catch(error) {
        res.status(500).json({ message: "Server error", error });
    }
});


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

//getting labs and days for labtech-labs
app.get("/labtech-laboratories", async(req, res) => {
    try{
        const labs = await Laboratory.find({}).lean();
        const selectedLabId = req.query.labs ? req.query.labs.toString() : null;
        console.log("Selected Lab ID: ", selectedLabId);

        let selectedLab = null;

        if(selectedLabId) {
            selectedLab = await Laboratory.findById(selectedLabId);
        }

        const today = new Date();
        const timeSlots = [
            "07:30 A.M.", "08:00 A.M.", "08:30 A.M.", "09:00 A.M.",
            "09:30 A.M.", "10:00 A.M.", "10:30 A.M.", "11:00 A.M.",
            "11:30 A.M.", "12:00 P.M.", "12:30 P.M.", "01:00 P.M.",
            "01:30 P.M.", "02:00 P.M.", "02:30 P.M.", "03:00 P.M.",
            "03:30 P.M.", "04:00 P.M.", "04:30 P.M.", "05:00 P.M.",
            "05:30 P.M.", "06:00 P.M.", "06:30 P.M.", "07:00 P.M.",
            "07:30 P.M.", "08:00 P.M.", "08:30 P.M.", "09:00 P.M."
        ];
        const next7Days = [];

        for(let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);

            next7Days.push({
                formattedDate: date.toISOString().split('T')[0],
                displayDate: date.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})
            });
        }

        res.render("labtech-laboratories", {labs, next7Days, timeSlots, selectedLabId, capacity: selectedLab ? selectedLab.capacity : 0});
    } catch(error) {
        res.status(500).json({ message: "Failed to get labs", error})
    }
})

// Initial Reservation Population
async function populateReservations(){
    const reservationsFound = await Reservation.find();
    if (reservationsFound.length == 0){
        // query db for userIds
        const reservations = [
            { userId: await User.findOne({ lastName: "Ho" })._id, laboratoryRoom: "GK101B", seatNumber: 26, bookingDate: new Date(), reservationDate: new Date(2025, 2, 10), startTime: "7:30 A.M.", endTime: "9:00 A.M." },
            { userId: await User.findOne({ lastName: "Capote" })._id, laboratoryRoom: "AG1904", seatNumber: 15, bookingDate: new Date(), reservationDate: new Date(2025, 2, 11), startTime: "10:00 A.M.", endTime: "11:30 A.M." },
            { userId: await User.findOne({ lastName: "Gonzales" })._id, laboratoryRoom: "GK401A", seatNumber: 32, bookingDate: new Date(), reservationDate: new Date(2025, 2, 12), startTime: "1:00 P.M.", endTime: "2:30 P.M." },
            { userId: await User.findOne({ lastName: "Rocha" })._id, laboratoryRoom: "AG1701", seatNumber: 8, bookingDate: new Date(), reservationDate: new Date(2025, 2, 13), startTime: "3:00 P.M.", endTime: "4:30 P.M." },
            { userId: await User.findOne({ lastName: "Rocha" })._id, laboratoryRoom: "GK102A", seatNumber: 19, bookingDate: new Date(), reservationDate: new Date(2025, 2, 14), startTime: "5:00 P.M.", endTime: "6:30 P.M." }
        ];
        
        await Reservation.insertMany(reservations);        
    }
}

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
app.get("/labtech-laboratories", (req, res) => res.render("labtech-laboratories"));
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
            { laboratoryName: "GK404B", capacity: 20 },
            { laboratoryName: "AG1904", capacity: 40 },
            { laboratoryName: "GK201A", capacity: 20 },
            { laboratoryName: "AG1706", capacity: 40 },
            { laboratoryName: "GK302A", capacity: 20 }
        ];

        await Laboratory.insertMany(labs);
    }
}

// Timeslot Update FUnction

async function updateTimeSlots() {
    const today = new Date().toISOString().split('T')[0];
    const timeSlotsFound = await TimeSlot.find();

    timeSlotsFound = timeSlotsFound.filter(slot => slot.date >= today);

    const newDate = new Date();
    newDate.setDate(new Date().getDate() + 6);
    newDate.toISOString().split('T')[0];

    const startTime = new Date();
    startTime.setHours(7, 30, 0, 0);

    const endTime = new Date();
    endTime.setHours(21, 0, 0, 0);

    const timeSlots = []
    
    if(timeSlotsFound.length > 0)
    {
        for(let i = 0; i < labs.length; i++)
        {
            for(let j = 1; j <= labs[i].capacity; j++)
            {
                for(let time = new Date(startTime); time <= endTime; time.setMinutes(time.getMinutes() + 30))
                {
                    const timeSlot = {
                        laboratoryId: labs[i].laboratoryId,
                        seatNumber: j,
                         date: newDate,
                        time: time.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timezone: 'Asia/Singapore'
                        }),
                        isAvailable: true
                    };

                    timeSlots.push(timeSlot);
                }
            }
        }
    }   

    await TimeSlot.insertMany(timeSlots);

}

cron.schedule('0 0 * * *', async() => {
    try{
        console.log("Updating time slots!");
        await updateTimeSlots();
    } catch(error) {
        console.error("Error occurred while updating the time slots: ", error)
    }
}, {timezone: 'Asia/Manila'});

// Initial Timeslot Population

// !!! WILL CONTINUE AFTER IMPLEMENTING CRON SCHEDULING

/* 
async function populateTimeSlots() {
    const timeSlotsFound = await TimeSlot.find();
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
                for(let day = 0; day <= 6; day++)
                {

                    const currDate = new Date();
                    currDate.setDate(new Date().getDate() + day);
                    currDate.toISOString().split('T')[0]

                    for(let time = new Date(startTime.getTime()); time <= endTime; time.setMinutes(time.getMinutes() + 30))
                {
                    const timeSlot = {
                        laboratoryId: labs[i].laboratoryId,
                        timeSlotId: --,
                        seatNumber: j,
                                date: currDate,
                                time: time.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                    timezone: 'Asia/Singapore'
                                }),
                        isAvailable: true
                    };

                    timeSlots.push(timeSlot);
                        }
                }
            }
        }

        await TimeSlot.insertMany(timeSlots);
    }
}

/*** USERS ***/

// request for form submission 
app.get("/signin", (req,res) => {
    // TODO: for sessions MCO3
})

// Sign-in form submission
app.post("/signin", async (req,res) => {
    const {email, password, rememberUser} = req.body;
    
    // validate entry
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }
    let user = await User.findOne({ email: email.toLowerCase() }).lean();
    
    if (user) {
        console.log(user);
        
        if (user.password === password) {

            // fetch all user data, use to render
            const userData = { 
                type: user.type, 
                firstName: user.firstName, 
                lastName: user.lastName, 
                email: user.email, 
                password: user.password, 
                biography: user.biography,
                department: user.department,
                image: user.image,
            }
            if (user.type === "Student"){
                res.render("student-home", { userData });
            } else{
                res.render("labtech-home", { userData });
            }

        } else { 
            // user passwords do not match
            res.status(401).json({ error: "Password is incorrect. Please try again" });
    } 
    } else {
        // email is not in database 
        res.status(401).json({ error: "Email does not match an existing account. Please try again or create an account." });
    }    
})

// TODO: Sign-up submission
app.post("/signup", async (req, res) => {
    const { firstName, lastName, email, newPass, confirmPass, type } = req.body;

    // VALIDATE FORM INPUTS

    if (!firstName || !lastName || !email || !newPass || !confirmPass) {
        return res.status(400).json({ error: "Please enter all fields required fields." });
    }

    // radio buttons not selected
    if (!type) {
        return res.status(400).json({error: "Please select an account type."})
    }

    // passwords dont match
    if (newPass !== confirmPass) {
        return res.status(400).json({ error: "Passwords do not match. Please try again." });
    }

    // check if email is already in use
    if (await User.findOne({ email: email.toLowerCase() }).lean()) {
        return res.status(400).json({ error: "Email already in use! Please use a different email." });
    }

    // CREATE USER AND ADD TO DATABASE
    const userData = { 
            type: type, 
            firstName: toTitleCase(firstName), 
            lastName: toTitleCase(lastName), 
            email: email, 
            password: confirmPass, 
        }

    const user = await User.create(userData)
    console.log("User created: " + user);

    // RENDER HOME
    if (type === "Student") {
        res.render("student-home", {userData})
    } else {
        res.render("labtech-home", {userData})
    }
});
// TODO: User (and reservations) deletion

// User edit
app.patch("/api/users/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// User (and reservations) deletion
app.post("/delete-user", async (req, res) => {
    // try {
    //     const password = req.body;

    //     // needs session management
       
    //     // find user by id and delete
    //     const user = await User.findByIdAndDelete(req.params.id);

    //     /*
    //     if (password === user.password) {
    //         delete user
    //     }
        
    //     */

    //     // delete all associated reservations, if any
    //     await Reservation.deleteMany({ userId: req.params.id });
    //     res.json({ message: "User and associated reservations deleted successfully" });
    // } catch (error) {
    //     res.status(500).json({ message: "Server error", error });
    // }
    res.sendFile(path.join(__dirname, "index.html"))
});


// Initial users
async function populateUsers() {
    const existingUsers = await User.find();
    
    if(existingUsers.length === 0) {
        const users = [
            { type: "Student", firstName: "Denise Liana", lastName: "Ho", image:"img/demo_data/sonoda.jpg", email: "denise_liana_ho@dlsu.edu.ph", password: "123", biography: "idk stream tsunami sea yeah", department: "Computer Science" },
            { type: "Student", firstName: "Anja", lastName: "Gonzales", image:"img/demo_data/ayase.jpg", email: "anja_gonzales@dlsu.edu.ph",  password: "234", biography: "i need sleep", department: "Computer Science" },
            { type: "Student", firstName: "Angelo", lastName: "Rocha", image:"img/demo_data/nozomi.jpg", email: "angelo_rocha@dlsu.edu.ph", password: "345", biography: "idk what to put here", department: "Computer Science" },
            { type: "Student", firstName: "Grass", lastName: "Capote", image:"img/demo_data/kousaka.jpg",email: "mary_grace_capote@dlsu.edu.ph", password: "456", biography: "send help", department: "Computer Science" },
            { type: "Faculty", firstName: "The", lastName: "Goat", image:"img/demo_data/kotori.jpg",email: "the_goat@dlsu.edu.ph", password: "admin", department:"Computer Science" },
        ];

        await User.insertMany(users);
    }
}

// helper functions
function toTitleCase(string) {
    return string.replace(
      /\w\S*/g,
      text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}

function populateDatabase() {
    populateUsers();
    populateLaboratories();
    populateReservations();
    //populateTimeSlots();
}

// populate database (for demo)
populateDatabase();

hbs.registerHelper("range", function(start, end, block){
    var result = '';
    for(let i = start; i <= end; i++) {
        result += block.fn(i)
    }
    return result;
})

hbs.registerHelper("equal", function(a, b, options) {
    console.log(`Comparing ${a} and ${b}`);
    return a === b ? options.fn(this) : options.inverse(this);
});

app.listen(3000, () => {
    console.log("Node server running at http://localhost:3000");
});
