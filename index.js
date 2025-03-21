const express = require("express");
const app = new express();
const fileUpload = require('express-fileupload')
const path = require("path");
const mongoose = require("mongoose");
const hbs = require("hbs");

// Configure middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // Serve files from root directory
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

// Configure handlebars
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Check if demo profiles exist, if not, seed the database
const User = require('./database/models/User');

const checkAndSeedDatabase = async () => {
    try {
      const userCount = await User.countDocuments();

        // We'll use require to run the seed script directly
        require('./database/seedDatabase');

    } catch (error) {
      console.error('Error checking database:', error);
    }
}


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://user:user@labmatedb.4fogp.mongodb.net/?retryWrites=true&w=majority&appName=LabMateDB";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    checkAndSeedDatabase();
    await client.close();
    
  }
}
run().catch(console.dir);

// Connect to MongoDB and check for demo profiles
mongoose.connect('mongodb://localhost/LabMateDB');


const Reservation = require('./database/models/Reservation');
const Laboratory = require("./database/models/Laboratory");
const TimeSlot = require("./database/models/TimeSlot");
const { timeSlots, endTimeOptions, morningTimeSlots } = require('./database/models/TimeSlotOptions');

// Basic routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/signup-page", (req, res) => res.sendFile(path.join(__dirname, "signup-page.html")));
app.get("/popup-profile", (req, res) => res.sendFile(path.join(__dirname, "popup-profile.html")));

// Get reservations across all users
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

// Update availability of time slots based on reservations
async function updateAvailability (){
    try{
        const reservation = Reservation.find();

        if (!reservations || reservations.length === 0) {
            console.log("No reservations found.");
            return { success: false, message: "No reservations found" };
        }
    } catch (error){

    }
}

// Get detailed user information by ID (must be defined BEFORE the more general route)
app.get("/api/user/details/:id", async (req, res) => {
    try {
        console.log(`Fetching detailed user info with ID: ${req.params.id}`);
        
        // Try to find the user in the User first
        let user = await User.findById(req.params.id);

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
            isLabTech: user.type === "Faculty"
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
        
        // Try to find the user in the User first
        let user = await User.findById(req.params.id);
        
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
            isLabTech: user.type === "Faculty"
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
        
        let user = await User.findById(req.params.id);

        if(!user) {
            return res.status(404).json({message: "User not found"});
        }


        // Update user fields
        user.department = req.body.department || user.department;
        user.biography = req.body.biography || user.biography;
        
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
                isLabTech: user.type === "Faculty"
            }
        });
    } catch (error) {
        console.error(`Error updating user: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get time slots for a specific date, lab, and seat
app.get("/api/timeslots/:date/:lab/:seat", async (req, res) => {
    try {
        const { date, lab, seat } = req.params;
        const seatNumber = Number(seat);
        const queryDate = new Date(date);

        const timeslots = await TimeSlot.find({ queryDate, lab, seatNumber });

        if (!timeslots.length) {
            return res.status(404).json({ message: "No timeslots found for the given criteria." });
        }

        res.json(timeslots);
    } catch (error) {
        console.error(`Error fetching timeslots: ${error.message}`);
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
        
        // Try to find the user in the User first
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Verify password (using plain text comparison as per user preference)
        if (password !== user.password) {
            return res.status(401).json({ message: "Incorrect password" });
        }
        
        // Delete all reservations associated with the user
        await Reservation.deleteMany({ userId: userId });
        
        // Delete the user account
        await User.findByIdAndDelete(userId);
        
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

// Serve the sign-up page
app.get("/signup-page", (req, res) => res.sendFile(path.join(__dirname, "signup-page.html")));

// Handle sign-up form submission
app.post("/signup", async (req, res) => {
    try {
        let { firstName, lastName, email, newPass, confirmPass, type } = req.body;
        
        email = email.toLowerCase();

        console.log("Received sign-up request:", { firstName, lastName, email, type });
        
        // Validate input
        if (!firstName || !lastName || !email || !newPass || !confirmPass) {
            return res.status(400).json({ error: "All fields are required" });
        }
        
        // Check if passwords match
        if (newPass !== confirmPass) {
            return res.status(400).json({ error: "Passwords do not match" });
        }
        
        // Check if email is already in use
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({ error: "Email is already in use" });
        }
        
        // Create new user based on account type
        if (type === "Student") {
            const newUser = new User({
                firstName,
                lastName,
                email,
                password: newPass,
                type: 'Student'
            });
            
            await newUser.save();
            console.log("New student user created:", newUser._id);
                     
            // Send success response with user info
            res.json({
                success: true,
                userId: newUser._id,
                isLabTech: false,
                redirect: "/student-home" 
            });
        } else if (type === "Faculty") {
            const facultyCode = req.body.facultyCode;
            
            // Faculty code is blank
            if (!facultyCode) {
                return res.status(400).json({ error: "Please enter a faculty code to proceed" });
            }
            
            // Verify faculty code (for demo: i-am-faculty)
            if (facultyCode !== "i-am-faculty") {
                return res.status(400).json({ error: "Invalid faculty code" });
            }

            const newUser = new User({
                firstName,
                lastName,
                email,
                password: newPass,
                type: 'Faculty'
            });
            
            await newUser.save();
            console.log("New lab tech user created:", newUser._id);
               
            // Send success response with user info
            res.json({
                success: true,
                userId: newUser._id,
                isLabTech: true,
                redirect: "/labtech-home" 
            });

        } else {
            return res.status(400).json({ error: "Invalid account type" });
        }
    } catch (error) {
        console.error("Error during sign-up:", error);
        res.status(500).json({ error: "An error occurred during sign-up" });
    }
});

// Serve the login page
app.get("/signin-page", (req, res) => res.sendFile(path.join(__dirname, "signin-page.html")));


// Handle sign-in form submission
app.post("/signin", async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.toLowerCase();

        console.log("Received sign-in request for email:", email);
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        
        // Try to find the user in the User first
        if (mongoose.connection.readyState !== 1) {
            console.error("❌ Database not connected. Cannot process sign-in request.");
            return res.status(500).json({ error: "Database connection lost. Please try again later." });
        }

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Verify password (using plain text comparison as per user preference)
        if (password !== user.password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Determine redirect URL based on user type
        const redirectUrl = user.type === "Faculty" ? "/labtech-home" : "/student-home";
        
        // Send success response with user info
        res.json({
            success: true,
            userId: user._id,
            isLabTech: user.type === "Faculty",
            redirect: redirectUrl
        });
        
    } catch (error) {
        console.error("Error during sign-in:", error.message, error.stack);
        res.status(500).json({ error: "An error occurred during sign-in" });
    }
});

// Serve the student and labtech page
app.get("/student-home", (req, res) => res.sendFile(path.join(__dirname, "student-home.html")));
app.get("/labtech-home", (req, res) => res.sendFile(path.join(__dirname, "labtech-home.html")));


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

// User Profiles

app.get("/profile/:id", async (req, res) => {
    try {
        console.log(`Fetching user with ID: ${req.params.id}`);
        
        // Try to find the user in the User first
        let user = await User.findById(req.params.id);
        
        /* TRY no need anymore kasi same schema na sila
        // If not found in User, try LabTech 
        if (!user) {
            user = await User.findById(req.params.id);
        }
        */
        
        if (!user) {
            console.log(`User not found with ID: ${req.params.id}`);
            return res.status(404).json({ message: "User not found" });
        }
        
        // Return user data without sensitive information
        const userData = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            email: user.email,
            biography: user.biography,
            department: user.department,
            type: user.type
        };
        
        res.render("popup-profile", {userData});

        console.log(`Found user: ${JSON.stringify(userData)}`);
    } catch (error) {
        console.error(`Error finding user: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

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

// Reservations

app.get("/see-reservations", (req, res) => res.sendFile(path.join(__dirname, "see-reservations.html")));

app.get("/labtech-reservations", (req, res) => {
    res.sendFile(path.join(__dirname, "labtech-reservations.html"));
})

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
        
        console.log(`Fetching reservations for lab: ${labId}, date: ${date}`);
        
        // Create start and end date for the query (beginning and end of the day)
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        
        // fetch lab data
        const lab = await Laboratory.findById(labId);
        if (!lab) {
            return res.status(404).json({ error: "Laboratory not found" });
        }

        // Find all reservations for the given lab and date
        const reservations = await Reservation.find({
            laboratoryRoom: lab.laboratoryName,
            reservationDate: {
                $gte: startDate,
                $lt: endDate
            }
        }).populate('userId', 'firstName lastName image');
        
        console.log(`Found ${reservations.length} reservations`);
        
        // Format the reservations for the response
        const formattedReservations = reservations.map(reservation => ({
            _id: reservation._id,
            seatNumber: reservation.seatNumber,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            userId: reservation.userId,
            studentName: reservation.studentName || (reservation.userId ? `${reservation.userId.firstName} ${reservation.userId.lastName}` : "Unknown"),
            isAnonymous: reservation.isAnonymous,
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
        const { labId, date, seatNumber, startTime, endTime, userId, isAnonymous } = req.body;
        
        // Validate inputs
        if (!labId || !date || !seatNumber || !startTime || !endTime || !userId) {
            return res.status(400).send("All fields are required");
        }
        
        console.log("Creating reservation with data:", req.body);
        
        // Format the reservation date
        const reservationDate = new Date(date);
        
        // fetch lab data
        const lab = await Laboratory.findById(labId);

        if (!lab) {
            return res.status(404).send("Laboratory not found");
        }

        // Check if there's already a reservation for this seat, date, and time
        const existingReservation = await Reservation.findOne({
            laboratoryRoom: lab.laboratoryName,
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
            studentName: `${userId.firstName} ${userId.lastName}`,
            laboratoryRoom: lab.laboratoryName,
            seatNumber: parseInt(seatNumber),
            bookingDate: new Date(),
            reservationDate: reservationDate,
            startTime,
            endTime,
            isAnonymous
        });
        
        await newReservation.save();

        // Update the availability of the timeslots selected
        const timeslots = await TimeSlot.find();
        
        
        // Redirect to see-reservations.html after successful booking
        res.redirect('/see-reservations');
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).send("An error occurred while creating the reservation");
    }
});

// Create a new reservation as labtech
app.post("/create-reservation-labtech", async (req, res) => {
    try {
        const { labId, date, seatNumber, startTime, endTime, userId, isAnonymous , studentName} = req.body;
        
        // Validate inputs
        if (!labId || !date || !seatNumber || !startTime || !endTime || !userId || !studentName) {
            return res.status(400).send("All fields are required");
        }
        
        console.log("Creating reservation with data:", req.body);
        
        // Format the reservation date
        const reservationDate = new Date(date);
        
        // fetch lab data
        const lab = await Laboratory.findById(labId);

        if (!lab) {
            return res.status(404).send("Laboratory not found");
        }

        // Check if there's already a reservation for this seat, date, and time
        const existingReservation = await Reservation.findOne({
            laboratoryRoom: lab.laboratoryName,
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
            studentName,
            laboratoryRoom: lab.laboratoryName,
            seatNumber: parseInt(seatNumber),
            bookingDate: new Date(),
            reservationDate: reservationDate,
            startTime,
            endTime,
            isAnonymous
        });
        
        await newReservation.save();

        // Update the availability of the timeslots selected
        const timeslots = await TimeSlot.find();
    
        // Redirect to labtech-reservations.html after successful booking
        res.redirect('/labtech-reservations');
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).send("An error occurred while creating the reservation");
    }
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

        res.render('labtech-laboratories', { 
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

//getting labs and days for labtech-labs
// Removed duplicate route

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

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
