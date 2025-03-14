const express = require("express");
const app = new express();
const bodyParser = require("body-parser");
// const { engine } = require("express-handlebars");
const fileUpload = require('express-fileupload')
const path = require("path");
const mongoose = require("mongoose");
const hbs = require("hbs");

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // Serve files from root directory
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload());

// Configure handlebars
//app.engine("hbs", engine({ extname: ".hbs", defaultLayout: "main"}))
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Check if demo profiles exist, if not, seed the database
const UserModel = require('./database/models/User');
const LabTechModel = require('./database/models/labtech');

const checkAndSeedDatabase = async () => {
  try {
    const userCount = await UserModel.countDocuments();
    const labTechCount = await LabTechModel.countDocuments();
    
    if (userCount === 0 || labTechCount === 0) {
      console.log('No profiles found. Seeding database with demo profiles...');
      // We'll use require to run the seed script directly
      require('./database/seedDatabase');
    } else {
      console.log(`Database already contains ${userCount} users and ${labTechCount} lab technicians.`);
    }
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

// Connect to MongoDB and check for demo profiles
mongoose.connect('mongodb://localhost/LabMateDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB successfully');
  // After successful connection, check and seed the database if needed
  checkAndSeedDatabase();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

const Reservation = require('./database/models/Reservation');
const Laboratory = require("./database/models/Laboratory");
const TimeSlot = require("./database/models/TimeSlot");

// API Endpoints for Reservations
app.get("/api/reservations", async (req, res) => {
    try {
        const reservations = await Reservation.find();
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// Get reservations for a specific user
app.get("/api/reservations/user/:userId", async (req, res) => {
    try {
        const reservations = await Reservation.find({ userId: req.params.userId });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// Get a specific reservation by ID
app.get("/api/reservation/:id", async (req, res) => {
    try {
        console.log(`Checking reservation with ID: ${req.params.id}`);
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            console.log(`Reservation not found with ID: ${req.params.id}`);
            return res.status(404).json({ message: "Reservation not found" });
        }
        console.log(`Found reservation: ${JSON.stringify(reservation)}`);
        res.json(reservation);
    } catch (error) {
        console.error(`Error finding reservation: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get user data by ID
app.get("/api/user/:id", async (req, res) => {
    try {
        console.log(`Fetching user with ID: ${req.params.id}`);
        
        // Try to find the user in the UserModel first
        let user = await UserModel.findById(req.params.id);
        
        // If not found in UserModel, try LabTechModel
        if (!user) {
            user = await LabTechModel.findById(req.params.id);
        }
        
        if (!user) {
            console.log(`User not found with ID: ${req.params.id}`);
            return res.status(404).json({ message: "User not found" });
        }
        
        // Return user data without sensitive information
        const userData = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isLabTech: user.constructor.modelName === 'LabTech'
        };
        
        console.log(`Found user: ${JSON.stringify(userData)}`);
        res.json(userData);
    } catch (error) {
        console.error(`Error finding user: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Create a new reservation
app.post("/api/reservation", async (req, res) => {
    try {
        const reservation = new Reservation(req.body);
        await reservation.save();
        res.status(201).json(reservation);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// Delete a specific reservation
app.delete("/api/reservation/:id", async (req, res) => {
    try {
        const reservationId = req.params.id;
        console.log(`Attempting to delete reservation with ID: ${reservationId}`);
        
        // Use findByIdAndRemove which handles ObjectId conversion automatically
        const deletedReservation = await Reservation.findByIdAndRemove(reservationId);
        
        if (!deletedReservation) {
            console.log(`Reservation not found with ID: ${reservationId}`);
            return res.status(404).json({ message: "Reservation not found" });
        }
        
        console.log(`Successfully deleted reservation: ${JSON.stringify(deletedReservation)}`);
        res.json({ message: "Reservation successfully deleted", reservation: deletedReservation });
    } catch (error) {
        console.error(`Error deleting reservation: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
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
            { userId: await UserModel.findOne({ lastName: "Ho" })._id, laboratoryRoom: "GK101B", seatNumber: 26, bookingDate: new Date(), reservationDate: new Date(2025, 2, 10), startTime: "7:30 A.M.", endTime: "9:00 A.M." },
            { userId: await UserModel.findOne({ lastName: "Capote" })._id, laboratoryRoom: "AG1904", seatNumber: 15, bookingDate: new Date(), reservationDate: new Date(2025, 2, 11), startTime: "10:00 A.M.", endTime: "11:30 A.M." },
            { userId: await UserModel.findOne({ lastName: "Gonzales" })._id, laboratoryRoom: "GK401A", seatNumber: 32, bookingDate: new Date(), reservationDate: new Date(2025, 2, 12), startTime: "1:00 P.M.", endTime: "2:30 P.M." },
            { userId: await UserModel.findOne({ lastName: "Rocha" })._id, laboratoryRoom: "AG1701", seatNumber: 8, bookingDate: new Date(), reservationDate: new Date(2025, 2, 13), startTime: "3:00 P.M.", endTime: "4:30 P.M." },
            { userId: await UserModel.findOne({ lastName: "Rocha" })._id, laboratoryRoom: "GK102A", seatNumber: 19, bookingDate: new Date(), reservationDate: new Date(2025, 2, 14), startTime: "5:00 P.M.", endTime: "6:30 P.M." }
        ];
        
        await Reservation.insertMany(reservations);        
    }
}

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html"))); 
app.get("/signup-page", (req, res) => res.sendFile(path.join(__dirname, "signup-page.html"))); 
app.get("/signin-page", (req, res) => res.sendFile(path.join(__dirname, "signin-page.html")));
app.get("/student-home", (req, res) => res.sendFile(path.join(__dirname, "student-home.html"))); 
app.get("/student-laboratories", async (req, res) => {
    try {
        const labs = await Laboratory.find({}).lean();
        const selectedLabId = req.query.labs ? req.query.labs.toString() : null;
        
        let selectedLab = null;
        if(selectedLabId) {
            selectedLab = await Laboratory.findById(selectedLabId);
        }

        // Get reservations for the selected lab if any
        let reservations = [];
        if(selectedLabId) {
            reservations = await Reservation.find({ laboratoryRoom: selectedLab.laboratoryName }).lean();
            
            // Populate student names for each reservation
            for(let i = 0; i < reservations.length; i++) {
                if(reservations[i].userId) {
                    const user = await UserModel.findById(reservations[i].userId).lean();
                    if(user) {
                        reservations[i].studentName = `${user.firstName} ${user.lastName}`;
                    } else {
                        reservations[i].studentName = "Anonymous User";
                    }
                }
            }
        }

        const today = new Date();
        const timeSlots = [
            "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM",
            "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
            "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM",
            "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM",
            "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM",
            "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM",
            "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"
        ];
        
        const endTimeOptions = [
            "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
            "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
            "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
            "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
            "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
            "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
            "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM"
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

        // Helper function to find a reservation for a specific seat and time
        const findReservation = (seatNumber, timeSlot) => {
            // Convert seatNumber from string to number since it comes from the template
            const seatNum = parseInt(seatNumber);
            const selectedDate = req.query.date ? req.query.date : null;
            
            return reservations.find(r => {
                // Check if seat number and time slot match
                const seatMatch = r.seatNumber === seatNum;
                const timeMatch = r.startTime === timeSlot;
                
                // If a date is selected, also check if the reservation date matches
                if (selectedDate) {
                    const reservationDate = new Date(r.reservationDate);
                    const formattedReservationDate = reservationDate.toISOString().split('T')[0];
                    return seatMatch && timeMatch && formattedReservationDate === selectedDate;
                }
                
                // If no date is selected, just check seat and time
                return seatMatch && timeMatch;
            });
        };

        // Register the helper function
        hbs.registerHelper('findReservation', findReservation);
        
        // Register the equal helper if not already registered
        if (!hbs.handlebars.helpers.equal) {
            hbs.registerHelper('equal', function(a, b, options) {
                console.log(`Comparing ${a} and ${b}`);
                return a === b ? options.fn(this) : options.inverse(this);
            });
        }

        res.render("student-laboratories", {
            labs, 
            next7Days, 
            timeSlots, 
            endTimeOptions,
            selectedLabId, 
            capacity: selectedLab ? selectedLab.capacity : 0,
            reservations,
            success: req.query.success === 'true'
        });
    } catch(error) {
        console.error("Error fetching laboratory data:", error);
        res.status(500).json({ message: "Failed to get labs", error });
    }
});
app.get("/signedout-lab", (req, res) => res.sendFile(path.join(__dirname, "signedout-laboratories.html"))); 

// Profile Pages
app.get("/popup-profile", (req, res) => {
    res.render("popup-profile", { userData: null });
});
app.get("/user-profile", (req, res) => res.sendFile(path.join(__dirname, "user-profile.html")));
app.get("/labtech-profile", (req, res) => res.sendFile(path.join(__dirname, "labtech-profile.html")));


// Profile Section Routes - Using route parameters for cleaner code
app.get("/profile-:section", (req, res) => {
    const section = req.params.section;
    const validSections = {
        'overview': '#overview',
        'account': '#dashboard',
        'edit': '#edit',
        'delete': '#delete'
    };
    
    const hash = validSections[section] || '';
    res.redirect(`/user-profile${hash}`);
});

// Labtech Profile Section Routes
app.get("/labtech-profile-:section", (req, res) => {
    const section = req.params.section;
    const validSections = {
        'overview': '#overview',
        'account': '#dashboard',
        'edit': '#edit',
        'delete': '#delete'
    };
    
    const hash = validSections[section] || '';
    res.redirect(`/labtech-profile${hash}`);
});

// Labtech Pages - Consolidated routes
app.get("/labtech-:page", (req, res) => {
    const page = req.params.page;
    
    // Special case for laboratories which uses a template
    if (page === 'laboratories') {
        return res.render("labtech-laboratories");
    }
    
    // For other pages, serve the HTML file
    res.sendFile(path.join(__dirname, `labtech-${page}.html`));
});

// Reservations
app.get("/see-reservations", (req, res) => res.sendFile(path.join(__dirname, "see-reservations.html")));

// Initial Database Population
async function populateDatabase() {
    try {
        // Check if reservations already exist
        const reservationsFound = await Reservation.find();
        if (reservationsFound.length === 0) {
            // Only populate reservations if none exist
            await populateReservations();
        }
    } catch (error) {
        console.error("Error populating database:", error);
    }
}

// populate database (for demo)
populateDatabase();

hbs.registerHelper("range", function(start, end, block) {
    let accum = '';
    for(let i = start; i <= end; i++) {
        accum += block.fn(i);
    }
    return accum;
});


hbs.registerHelper("equal", function(a, b, options) {
    console.log(`Comparing ${a} and ${b}`);
    return a === b ? options.fn(this) : options.inverse(this);
});

// Create a new reservation
app.post("/create-reservation", async (req, res) => {
    try {
        const { labId, date, seatNumber, startTime, endTime } = req.body;
        
        // Validate inputs
        if (!labId || !date || !seatNumber || !startTime || !endTime) {
            return res.status(400).send("All fields are required");
        }
        
        // Get laboratory information
        const laboratory = await Laboratory.findOne({ laboratoryName: labId });
        if (!laboratory) {
            return res.status(404).send("Laboratory not found");
        }
        
        // Find a demo user from the database to use for reservations
        const demoUser = await UserModel.findOne({ firstName: 'Anja' });
        if (!demoUser) {
            return res.status(400).send("No demo user found in the database. Please check if the database is properly seeded.");
        }
        const userId = demoUser._id;
        
        // Format the reservation date
        const reservationDate = new Date(date);
        
        // Check if there's already a reservation for this seat, date, and time
        const existingReservation = await Reservation.findOne({
            laboratoryRoom: labId,
            seatNumber: parseInt(seatNumber),
            reservationDate: reservationDate,
            startTime: startTime
        });
        
        if (existingReservation) {
            return res.status(400).send("This seat is already reserved for the selected time");
        }
        
        // Create and save the new reservation
        const newReservation = new Reservation({
            userId,
            laboratoryRoom: labId,
            seatNumber: parseInt(seatNumber),
            bookingDate: new Date(),
            reservationDate: reservationDate,
            startTime,
            endTime
        });
        
        await newReservation.save();
        
        // Redirect back to the laboratories page with success message and selected lab and date
        res.redirect(`/student-laboratories?success=true&labs=${laboratory._id}&date=${date}`);
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).send("An error occurred while creating the reservation");
    }
});

// Handle user login
app.post("/signin", async (req, res) => {
    try {
        console.log("Login attempt received:", req.body);
        const { email, password } = req.body;
        
        // Validate inputs
        if (!email || !password) {
            console.log("Missing email or password");
            return res.status(400).json({ error: "Email and password are required" });
        }
        
        // Check if it's a student login
        let user = await UserModel.findOne({ email });
        let isLabTech = false;
        
        // If not found as a student, check if it's a lab technician
        if (!user) {
            console.log("User not found in UserModel, checking LabTechModel");
            user = await LabTechModel.findOne({ email });
            isLabTech = !!user;
        }
        
        // If user not found in either collection
        if (!user) {
            console.log("User not found in either collection");
            return res.status(401).json({ error: "Invalid email or password" });
        }
        
        console.log("User found:", user.email, "isLabTech:", isLabTech);
        
        // Check password (using plain text comparison as per project requirements)
        if (user.password !== password) {
            console.log("Password mismatch");
            return res.status(401).json({ error: "Invalid email or password" });
        }
        
        // Determine redirect based on user type
        const redirectUrl = isLabTech ? "/labtech-profile" : "/user-profile";
        console.log("Login successful, redirecting to:", redirectUrl);
        
        // Successful login
        res.status(200).json({ 
            success: true, 
            redirect: redirectUrl,
            userId: user._id,
            isLabTech
        });
        
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "An error occurred during login" });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
