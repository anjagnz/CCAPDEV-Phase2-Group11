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
const { timeSlots, endTimeOptions, morningTimeSlots } = require('./database/models/TimeSlotOptions');

// Basic routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/signup-page", (req, res) => res.sendFile(path.join(__dirname, "signup-page.html")));
app.get("/signin-page", (req, res) => res.sendFile(path.join(__dirname, "signin-page.html")));
app.get("/student-home", (req, res) => res.sendFile(path.join(__dirname, "student-home.html")));
app.get("/popup-profile", (req, res) => res.sendFile(path.join(__dirname, "popup-profile.html")));

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

// Get detailed user information by ID (must be defined BEFORE the more general route)
app.get("/api/user/details/:id", async (req, res) => {
    try {
        console.log(`Fetching detailed user info with ID: ${req.params.id}`);
        
        // Try to find the user in the UserModel first
        let user = await UserModel.findById(req.params.id);
        let isLabTech = false;
        
        // If not found in UserModel, try LabTechModel
        if (!user) {
            user = await LabTechModel.findById(req.params.id);
            isLabTech = true;
        }
        
        if (!user) {
            console.log(`User not found with ID: ${req.params.id}`);
            return res.status(404).json({ message: "User not found" });
        }
        
        // Return detailed user data
        const userDetails = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            department: user.department,
            biography: user.biography,
            image: user.image,
            isLabTech: isLabTech
        };
        
        console.log(`Found detailed user info: ${JSON.stringify(userDetails)}`);
        res.json(userDetails);
    } catch (error) {
        console.error(`Error finding detailed user info: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get user by ID (basic info)
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

// Update user profile
app.put("/api/user/update/:id", async (req, res) => {
    try {
        console.log(`Updating user with ID: ${req.params.id}`, req.body);
        
        // Check which model the user belongs to
        let user = await UserModel.findById(req.params.id);
        let isLabTech = false;
        
        if (!user) {
            user = await LabTechModel.findById(req.params.id);
            isLabTech = true;
            
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
        }
        
        // Verify current password (using plain text comparison as per user preference)
        if (req.body.currentPassword !== user.password) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }
        
        // Update user fields
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.email = req.body.email || user.email;
        user.department = req.body.department || user.department;
        user.biography = req.body.biography || user.biography;
        
        // Update password if provided
        if (req.body.newPassword) {
            user.password = req.body.newPassword;
        }
        
        // Handle image upload if provided
        if (req.files && req.files.profileImage) {
            const profileImage = req.files.profileImage;
            const uploadPath = path.join(__dirname, 'public/uploads', `${user._id}_${profileImage.name}`);
            
            // Save the file
            await profileImage.mv(uploadPath);
            
            // Update the user's image path
            user.image = `/uploads/${user._id}_${profileImage.name}`;
        }
        
        // Save the updated user
        await user.save();
        
        res.json({ 
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                department: user.department,
                biography: user.biography,
                image: user.image,
                isLabTech: isLabTech
            }
        });
    } catch (error) {
        console.error(`Error updating user: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete a specific reservation
app.delete("/api/reservation/:id", async (req, res) => {
    try {
        const reservationId = req.params.id;
        console.log(`Attempting to delete reservation with ID: ${reservationId}`);
        
        // Find and delete the reservation
        const reservation = await Reservation.findByIdAndDelete(reservationId);
        
        if (!reservation) {
            console.log(`Reservation not found with ID: ${reservationId}`);
            return res.status(404).json({ message: "Reservation not found" });
        }
        
        console.log(`Successfully deleted reservation with ID: ${reservationId}`);
        res.json({ message: "Reservation deleted successfully" });
    } catch (error) {
        console.error(`Error deleting reservation: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete user account
app.delete("/api/user/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const { password } = req.body;
        
        console.log(`Attempting to delete user account with ID: ${userId}`);
        
        // Try to find the user in the UserModel first
        let user = await UserModel.findById(userId);
        let isLabTech = false;
        
        if (!user) {
            user = await LabTechModel.findById(userId);
            isLabTech = true;
            
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
        }
        
        // Verify password (using plain text comparison as per user preference)
        if (password !== user.password) {
            return res.status(401).json({ message: "Incorrect password" });
        }
        
        // Delete all reservations associated with the user
        if (!isLabTech) {
            await Reservation.deleteMany({ userId: userId });
        }
        
        // Delete the user account
        if (isLabTech) {
            await LabTechModel.findByIdAndDelete(userId);
        } else {
            await UserModel.findByIdAndDelete(userId);
        }
        
        console.log(`Successfully deleted user account with ID: ${userId}`);
        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error(`Error deleting user account: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

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

// Register Handlebars helpers
const findReservation = function(seatNum, timeSlot, reservations) {
    return reservations.find(r => {
        const seatMatch = r.seatNumber === parseInt(seatNum);
        const timeMatch = r.startTime === timeSlot;
        return seatMatch && timeMatch;
    });
};

const findReservationIndex = function(seatNum, timeSlot, reservations) {
    return reservations.findIndex(r => {
        const seatMatch = r.seatNumber === parseInt(seatNum);
        const timeMatch = r.startTime === timeSlot;
        return seatMatch && timeMatch;
    });
};

// Register the helpers globally
hbs.registerHelper('findReservation', findReservation);
hbs.registerHelper('findReservationIndex', findReservationIndex);
hbs.registerHelper('equal', function(a, b) {
    return a === b;
});
hbs.registerHelper('range', function(start, end) {
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
});

// Routes for laboratory pages with database loading
app.get("/student-laboratories", async (req, res) => {
    try {
        const labs = await Laboratory.find({}).lean();
        const today = new Date();
        const next7Days = [];
        for(let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            next7Days.push({
                formattedDate: date.toISOString().split('T')[0],
                displayDate: date.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})
            });
        }

        // Get any existing reservations
        const reservations = await Reservation.find().lean().populate('userId', 'firstName lastName');

        res.render('student-laboratories', { 
            labs, 
            next7Days, 
            timeSlots,
            reservations 
        });
    } catch (error) {
        console.error('Error fetching laboratories:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/signedout-laboratories", async (req, res) => {
    try {
        const labs = await Laboratory.find({}).lean();
        const today = new Date();
        const next7Days = [];
        for(let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            next7Days.push({
                formattedDate: date.toISOString().split('T')[0],
                displayDate: date.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})
            });
        }

        // Get any existing reservations
        const reservations = await Reservation.find().lean().populate('userId', 'firstName lastName');

        res.render('signedout-laboratories', { 
            labs, 
            next7Days, 
            timeSlots,
            reservations 
        });
    } catch (error) {
        console.error('Error fetching laboratories:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/labtech-laboratories", async (req, res) => {
    try {
        const labs = await Laboratory.find({}).lean();
        const selectedLabId = req.query.labs ? req.query.labs.toString() : null;
        
        const today = new Date();
        const next7Days = [];
        for(let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            next7Days.push({
                formattedDate: date.toISOString().split('T')[0],
                displayDate: date.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})
            });
        }

        // Get any existing reservations
        const reservations = await Reservation.find().lean().populate('userId', 'firstName lastName');

        res.render("labtech-laboratories", {
            labs, 
            next7Days, 
            timeSlots, 
            endTimeOptions,
            selectedLabId,
            reservations
        });
    } catch (error) {
        console.error('Error fetching laboratories:', error);
        res.status(500).send('Internal Server Error');
    }
});

//getting labs and days for labtech-labs
// Removed duplicate route

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

// API endpoint to check seat availability
app.get("/api/reservations/check-availability", async (req, res) => {
    try {
        const { lab, date, seatNumber, startTime, endTime } = req.query;
        
        // Validate inputs
        if (!lab || !date || !seatNumber || !startTime || !endTime) {
            return res.status(400).json({ available: false, message: "All parameters are required" });
        }
        
        // Format the reservation date
        const reservationDate = new Date(date);
        
        // Check if there's already a reservation for this seat, date, and time
        const existingReservation = await Reservation.findOne({
            laboratoryRoom: lab,
            seatNumber: parseInt(seatNumber),
            reservationDate: reservationDate,
            startTime: startTime
        });
        
        if (existingReservation) {
            return res.json({ available: false, message: "This seat is already reserved for the selected time" });
        }
        
        // If no reservation found, the seat is available
        return res.json({ available: true, message: "Seat is available" });
    } catch (error) {
        console.error("Error checking seat availability:", error);
        res.status(500).json({ available: false, message: "An error occurred while checking seat availability" });
    }
});

// API endpoint to get reservations for a lab and date
app.get("/api/reservations/lab/:labId/date/:date", async (req, res) => {
    try {
        const { labId, date } = req.params;
        
        // Validate inputs
        if (!labId || !date) {
            return res.status(400).json({ error: "Laboratory and date are required" });
        }
        
        // Format the reservation date
        const reservationDate = new Date(date);
        
        console.log(`Fetching reservations for lab: ${labId}, date: ${date}`);
        
        // Find all reservations for the given lab and date
        const reservations = await Reservation.find({
            laboratoryRoom: labId,
            reservationDate: {
                $gte: new Date(date + "T00:00:00.000Z"),
                $lt: new Date(date + "T23:59:59.999Z")
            }
        });
        
        console.log(`Found ${reservations.length} reservations`);
        
        // Format the reservations for the response
        const formattedReservations = reservations.map(reservation => ({
            _id: reservation._id,
            seatNumber: reservation.seatNumber,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            userId: reservation.userId
        }));
        
        res.json({ reservations: formattedReservations });
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ error: "An error occurred while fetching reservations" });
    }
});

// Create a new reservation
app.post("/create-reservation", async (req, res) => {
    try {
        const { labId, date, seatNumber, startTime, endTime, userId } = req.body;
        
        // Validate inputs
        if (!labId || !date || !seatNumber || !startTime || !endTime || !userId) {
            return res.status(400).send("All fields are required");
        }
        
        console.log("Creating reservation with data:", req.body);
        
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
        
        // Redirect to see-reservations.html after successful booking
        res.redirect('/see-reservations');
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
