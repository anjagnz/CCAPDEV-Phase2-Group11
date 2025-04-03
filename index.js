const express = require("express");
const fileUpload = require('express-fileupload')
const path = require("path");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const argon2 = require("argon2") // password hashing
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongodbsesh = require("connect-mongodb-session")(session)

// Database
const dbUri = 'mongodb://localhost/LabMateDB';
const User = require('./database/models/User');
const Reservation = require('./database/models/Reservation');
const Laboratory = require("./database/models/Laboratory");
const { timeSlots, endTimeOptions, morningTimeSlots } = require('./database/models/TimeSlotOptions');

// Configure middleware
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

// Configure handlebars
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.engine("hbs", exphbs.engine({
    extname: "hbs",
    helpers: {
        eq: (a, b) => a === b,
        isRemovable: (reservationId, removableReservations, options) => {
            return removableReservations.some(r => r._id.toString() === reservationId.toString()) 
                ? options.fn(this) 
                : options.inverse(this);
        }
    }
}));

// Connect to MongoDB based on provided db uri (deployed or local)
mongoose.connect(process.env.DATABASE_URL || dbUri)
.then(async () => {
    console.log('Connected to MongoDB successfully');
    
    // Check if database is empty, seed if yez
    const userCount = await User.countDocuments();
    const labCount = await Laboratory.countDocuments();
    
    if (userCount === 0 && labCount === 0) {
        // Seed database with script
        console.log('Database is empty. Seeding database...');
        await require('./database/seedDatabase');
    } else {
        console.log('Database currently has '+userCount+' users & '+labCount+' laboratories.');
    }
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});

// Store sessions in MongoDB
const store = new mongodbsesh({
    uri: process.env.DATABASE_URL || dbUri, 
    collection: "sessions"
});

// catch any errors
store.on('error', function(error) {
    console.error('Session store error:', error);
});

// Configure sessions and cookies
app.use(cookieParser());
app.use(session({
    secret: "secret-key-shhhh",
    resave: false,
    saveUninitialized: false, 
    cookie: {
        httpOnly: true,
        maxAge: null // to be set by remember me checkbox
    },
    store: store,
}));

// Authenticator (for signed-in pages)
const isAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/signin-page");
    }
};

// Type verifier (for type-specific pages) 
const verifyType = (req, res, next) => {
    if (req.session.user.type === "Faculty" && req.path.startsWith("/student")) {
        res.redirect("/labtech-home");
    } else if (req.session.user.type === "Student" && req.path.startsWith("/labtech")){
        res.redirect("/student-home")
    } else {
        next()
    }
};

// session checker; prints session details in console
app.use(async (req, res, next) => {
    if (req.session && req.session.user) {
        console.log("Current session user:", 
            req.session.user.firstName + " " + req.session.user.lastName,
            "/ Times visited:", req.session.visitCount,
            "/ Remember period:", (req.session.cookie.maxAge / (24 * 60 * 60 * 1000)).toFixed(1) + " days"
        );
    } else {
        console.log("No user is currently logged in.");
    }
    next();
});

// get session data (for temporary localstorage stuff)
app.get("/api/session", (req, res) => {
    if (req.session && req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: "No user session found" });
    }
});

/* SIGNED-OUT ROUTES */

app.get("/", async (req, res) => {
    // Redirect user to their homepage, if exist
    if (req.session.user) {
        
        // Check if user still exists in database before redirecting
        const user = await User.findById(req.session.user._id);
        if (!user) {
            console.log("User no longer exists in database. Destroying session...");
            req.session.destroy(() => {
                res.clearCookie("connect.sid");
                res.render("index");
            });
            return;
        }

        // extend user remember period
        if (req.session.cookie.maxAge) {
            req.session.cookie.maxAge += 3 * 7 * 24 * 60 * 60 * 1000;
        }

        // count visit (to check if remember period works)
        req.session.visitCount = (req.session.visitCount || 0) + 1;

        // redirect to user homepage based on type
        if (user.type === 'Faculty') {
            res.redirect("/labtech-home");
        } else {
            res.redirect("/student-home");
        }
    } else {
        res.render("index");
    }
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/signin-page", (req, res) => {
    // Redirect user to homepage, if exist
    if (req.session.user) {
        if (req.session.user.type === 'Faculty') {
            res.redirect("/labtech-home");
        } else { 
            res.redirect("/student-home");
        }
    } else {
        res.render("signin-page");
    }
});

app.get("/signup-page", (req, res) => {
    // Redirect user to homepage, if exist
    if (req.session.user) {
        if (req.session.user.type === 'Faculty') {
            res.redirect("/labtech-home");
        } else { 
            res.redirect("/student-home");
        }
    } else {
        res.render("signup-page");
    }
});

app.post("/signin", async (req, res) => {
    try {
        let { email, password, rememberMe} = req.body;
        email = email.toLowerCase();

        console.log("Received sign-in request for email:", email);
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        
        // Find if user exists
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: "Account does not exist. Please try again with a different email" });
        }

        try {
            // Verify passwords are the same
            const passMatch = await argon2.verify(user.password, password);
            if (!passMatch) {
                return res.status(401).json({ error: "Password is incorrect. Please try again." });
            }
        } catch (verifyError) {
            console.error("Password verification error:", verifyError.message);
            
            // Check if the error is related to the hash format
            if (verifyError.message.includes("must contain a $ as first char")) {
                // This indicates the password hash in the database is incorrectly formatted
                return res.status(401).json({ 
                    error: "There was an issue with your password. Please try again later or contact support."
                });
            }
            
            // For any other password verification errors
            return res.status(401).json({ error: "Authentication failed. Please try again." });
        }

        // Store user data in session
        req.session.user = user.toObject();

        // Set rememberMe period based on checkbox
        if (rememberMe) {
            // set to 3 weeks
            req.session.cookie.maxAge = 3 * 7 * 24 * 60 * 60 * 1000;
        } 

        // handle visit count
        req.session.visitCount = 1;

        // Redirect user based on their type
        if (user.type === "Faculty") {
            res.redirect("/labtech-home");
        } else {
            res.redirect("/student-home");
        }
        
    } catch (error) {
        console.error("Error during sign-in:", error.message, error.stack);
        res.status(500).json({ error: "An error occurred during sign-in" });
    }
});

app.post("/signup", async (req, res) => {
    try {
        let { firstName, lastName, email, newPass, confirmPass, type, facultyCode} = req.body;
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

        // Faculty code is blank
        if (type === "Faculty" && !facultyCode) {
            return res.status(400).json({ error: "Please enter a faculty code to proceed" });
        }

        // Verify faculty code (for demo: i-am-faculty)
        if (type === "Faculty" && facultyCode !== "i-am-faculty") {
            return res.status(400).json({ error: "Invalid faculty code" });
        }

        // Hash password
        const hashPass = await argon2.hash(newPass);

        // Create new user
        const newUser = new User({
                firstName,
                lastName,
                email,
                password: hashPass,
                type: type
        });

        // Add to the database
        await newUser.save();
        console.log("New "+type+" user created:", newUser._id);
        
        // Store user data in session
        req.session.user = newUser.toObject();

        // handle visit count
        req.session.visitCount = 1;

        // Redirect user based on their type
        if (newUser.type === "Faculty") {
            res.redirect("/labtech-home");
        } else {
            res.redirect("/student-home");
        }
        
    } catch (error) {
        console.error("Error during sign-up:", error);
        res.status(500).json({ error: "An error occurred during sign-up" });
    }
});

app.get("/signedout-laboratories", async (req, res) => {
    try {
        const labs = await Laboratory.find({}).lean();
        const today = new Date();
        const next7Days = [];
        for(let i = 0; i <= 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            next7Days.push({
                formattedDate: date.toISOString().split('T')[0],
                displayDate: date.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})
            });
        }

        // Get any existing reservations
        const reservations = await Reservation.find().lean().populate('userId', 'firstName lastName isAnonymous type');

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

/* SIGNED-IN ROUTES */

// Homes

app.get("/student-home", isAuth, verifyType, async (req, res) => {

    // Refresh user data with database data
    const user = await User.findById(req.session.user._id);
    req.session.user = user.toObject(); 

    // Check if user is authorized to access student home
    res.render("student-home", {user: req.session.user});
});

app.get("/labtech-home", isAuth, verifyType, async (req, res) => {

    // Refresh user data with database data
    const user = await User.findById(req.session.user._id);
    req.session.user = user.toObject();

    // Check if user is authorized to access faculty home
    res.render("labtech-home", {user: req.session.user});
});

// Laboratories

app.get("/student-laboratories", isAuth, verifyType, async (req, res) => {
    try {
        const labs = await Laboratory.find({}).lean();
        const today = new Date();
        const next7Days = [];
        for(let i = 0; i <= 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            next7Days.push({
                formattedDate: date.toISOString().split('T')[0],
                displayDate: date.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})
            });
        }

        // Get any existing reservations
        const reservations = await Reservation.find().lean().populate('userId', 'firstName lastName type');

        res.render('student-laboratories', { 
            labs, 
            next7Days, 
            timeSlots,
            reservations,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching laboratories:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/labtech-laboratories", isAuth, verifyType, async (req, res) => {
    try {
        const labs = await Laboratory.find({}).lean();
        const today = new Date();
        const next7Days = [];
        for(let i = 0; i <= 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            next7Days.push({
                formattedDate: date.toISOString().split('T')[0],
                displayDate: date.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})
            });
        }

        // Get any existing reservations
        const reservations = await Reservation.find().lean().populate('userId', 'firstName lastName type');

        res.render('labtech-laboratories', { 
            labs, 
            next7Days, 
            timeSlots,
            reservations,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching laboratories:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Reservations

app.get("/student-reservations", isAuth, verifyType, async (req, res) => {
    try{
        const reservations = await Reservation.find({userId : req.session.user._id}).lean();

        reservations.sort((a, b) => {
            // sort by reservation date
            const dateComparison = new Date(a.reservationDate) - new Date(b.reservationDate);
            if (dateComparison !== 0) return dateComparison;
        
            // then sort by start time
            const startTimeComparison = convertTimeToMinutes(a.startTime) - convertTimeToMinutes(b.startTime);
            if (startTimeComparison !== 0) return startTimeComparison;
        
            // then sort by end time
            return convertTimeToMinutes(a.endTime) - convertTimeToMinutes(b.endTime);
        });

        // format reservation date
        reservations.forEach(reservation=>{            
            const formattedDate = new Date(reservation.reservationDate).toLocaleDateString("en-US", {
                timeZone: "Asia/Singapore",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });

            reservation.reservationDate = formattedDate;
        })

        res.render('student-reservations', {
            reservations,
            user: req.session.user
        });
    } catch (error){
        console.error('Error fetching reservations:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/labtech-reservations", isAuth, verifyType, async(req, res) => {
    try{
        const reservations = await Reservation.find().lean();

        reservations.sort((a, b) => {
            // sort by reservation date
            const dateComparison = new Date(a.reservationDate) - new Date(b.reservationDate);
            if (dateComparison !== 0) return dateComparison;
        
            // then sort by start time
            const startTimeComparison = convertTimeToMinutes(a.startTime) - convertTimeToMinutes(b.startTime);
            if (startTimeComparison !== 0) return startTimeComparison;
        
            // then sort by end time
            return convertTimeToMinutes(a.endTime) - convertTimeToMinutes(b.endTime);
        });

        // format reservation date
        reservations.forEach(reservation=>{            
            const formattedDate = new Date(reservation.reservationDate).toLocaleDateString("en-US", {
                timeZone: "Asia/Singapore",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });

            reservation.reservationDate = formattedDate;
        })    

        // get removable reservations
        const removableReservations = [];
        reservations.forEach(reservation => {
            var reservationDate = reservation.reservationDate;
            const currentDate = new Date(); 
            const reservationDateTime = new Date(reservationDate);

            const startTimeStr = reservation.startTime;
            const [time, period] = startTimeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (period === 'P.M.' && hours < 12) {
                hours += 12;
            } else if (period === 'A.M.' && hours === 12) {
                hours = 0;
            }

            reservationDateTime.setHours(hours, minutes, 0, 0);

            const timeDiff = (currentDate - reservationDateTime) / (1000 * 60);
            const currentDateGMT8 = currentDate.toLocaleDateString("en-US", {
                timeZone: "Asia/Singapore",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });;

            const isWithin10Minutes = timeDiff >= 10;

            console.log(`Time Diff: ${timeDiff} Reservation Date: ${reservationDateTime} Current Date: ${currentDate}Date (GMT+8): ${currentDateGMT8}`);

            if(isWithin10Minutes) {
                removableReservations.push(reservation._id);
            }

        });

        res.render('labtech-reservations', {
            reservations,
            user: req.session.user,
            removableReservations
        });
    } catch(error){
        console.error('Error fetching reservations:', error);
        res.status(500).send('Internal Server Error');
    }
})


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

app.get("/logout", (req, res) => {
    console.log("Destroying session and clearing remember me period...");
    req.session.destroy(() => {
        res.clearCookie("connect.sid");       
        res.redirect("/");
    });
});

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

app.put("/api/user/update", isAuth, async (req, res) => {
    try {
        console.log(`Updating user with ID: ${req.session.user._id}`, req.body);
        
        let user = await User.findById(req.session.user._id);

        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        // Update text fields
        user.department = req.body.department || user.department;
        user.biography = req.body.biography || user.biography;
        
        // Handle image upload if provided
        if (req.files && req.files.image) {
            const image = req.files.image;
            const uploadPath = path.join(__dirname, 'public/uploads', `${user._id}_${image.name}`);
            
            // Save the file
            await image.mv(uploadPath);
            
            // Update the user's image path in database
            user.image = `/uploads/${user._id}_${image.name}`;
        }

        // Save the updated user
        await user.save();
        
        // Update session with new user data;
        req.session.user = user.toObject();
        

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: user
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

// Delete past reservations

async function deletePastReservations() {
    try {
        const currentDateTime = new Date();
        
        const reservations = await Reservation.find({});
        
        let deletionsOccurred = false;

        const pastReservations = reservations.filter(reservation => {
            const reservationDate = new Date(reservation.reservationDate);
            
            const endTimeStr = reservation.endTime;
            const [time, period] = endTimeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            
            if (period === 'P.M.' && hours < 12) {
                hours += 12;
            } else if (period === 'A.M.' && hours === 12) {
                hours = 0;
            }

            reservationDate.setHours(hours, minutes, 0, 0);

            return reservationDate <= currentDateTime;
        })

        if (pastReservations.length > 0) {
            await Promise.all(pastReservations.map(async (reservation) => {
                await Reservation.findByIdAndDelete(reservation._id);
                console.log(`Deleted past reservation: ${reservation.laboratoryRoom} on ${reservation.reservationDate}`);
            }))
            deletionsOccurred = true;
        }

        if (deletionsOccurred) {
            console.log('Reservation Deletion Check: Past reservations deleted.');
        } else {
            console.log('Reservation Deletion Check: All reservations are ongoing/upcoming.');
        }
    } catch (error) {
        console.error("Error deleting past reservations:", error);
    }
}

app.delete("/api/user/delete", async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { password } = req.body;
        
        console.log(`Attempting to delete user account with ID: ${userId}`);
        
        // Try to find the user in the User first
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Verify password
        const matchPass = await argon2.verify(user.password, password)
        if (!matchPass) {
            return res.status(401).json({ message: "Incorrect password" });
        }
        
        // Delete all reservations associated with the user
        await Reservation.deleteMany({ userId: userId });
        
        // Delete the user account
        await User.findByIdAndDelete(userId);
        
        console.log(`Successfully deleted user account with ID: ${userId}`);
        res.json({ success: true, message: "Account deleted successfully" });
        
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

// Profile Pages
app.get("/popup-profile", isAuth, (req, res) => {
    res.render("popup-profile", { userData: null });
});

app.get("/student-profile", isAuth, async (req, res) => {

    const user = req.session.user;
    const reservations = await Reservation.find({userId: user._id})
        .select('laboratoryRoom reservationDate startTime endTime seatNumber').lean();

    reservations.sort((a, b) => {
        // sort by reservation date
        const dateComparison = new Date(a.reservationDate) - new Date(b.reservationDate);
        if (dateComparison !== 0) return dateComparison;
        
        // then sort by start time
        const startTimeComparison = convertTimeToMinutes(a.startTime) - convertTimeToMinutes(b.startTime);
        if (startTimeComparison !== 0) return startTimeComparison;
        
        // then sort by end time
        return convertTimeToMinutes(a.endTime) - convertTimeToMinutes(b.endTime);
    });

    const upcomingReservations = reservations
        .filter(reservation => {
            const now = new Date();
            const reservationDateTime = new Date(reservation.reservationDate);

            const reservationTime = convertTo24Hour(reservation.startTime);
            if (!reservationTime) return false;

            reservationDateTime.setHours(reservationTime.hours, reservationTime.minutes, 0, 0);

            return reservationDateTime > now;
        })
        .sort((one, two) => {
            const dateOne = new Date(one.reservationDate);
            const dateTwo = new Date(two.reservationDate);

            const timeOne = convertTo24Hour(one.startTime);
            const timeTwo = convertTo24Hour(two.startTime);

            dateOne.setHours(timeOne.hours, timeOne.minutes, 0, 0);
            dateTwo.setHours(timeTwo.hours, timeTwo.minutes, 0, 0);

            return dateOne - dateTwo;
        })

    let upcomingLab = "No upcoming reservations.";

    if (upcomingReservations.length > 0) {
        upcomingLab = `${upcomingReservations[0].laboratoryRoom} on ${new Date(upcomingReservations[0].reservationDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} at ${upcomingReservations[0].startTime}`;
    }
    

    // format data passed for display
    const formattedReservations = reservations.map(reservation => {
        return {
            lab: reservation.laboratoryRoom,
            date: reservation.reservationDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            time: reservation.startTime + " - " + reservation.endTime,
            seat: reservation.seatNumber,
            status: getStatus(reservation)
        };
    });

    // Render profile with data
    res.render("student-profile", { upcomingLab, reservations: formattedReservations, user });
});

app.get("/labtech-profile", isAuth, async (req, res) => {
    const reservations = await Reservation.find()
        .select('laboratoryRoom reservationDate startTime endTime seatNumber')
        .lean();

    reservations.sort((a, b) => {
        // sort by reservation date
        const dateComparison = new Date(a.reservationDate) - new Date(b.reservationDate);
        if (dateComparison !== 0) return dateComparison;
        
        // then sort by start time
        const startTimeComparison = convertTimeToMinutes(a.startTime) - convertTimeToMinutes(b.startTime);
        if (startTimeComparison !== 0) return startTimeComparison;
        
        // then sort by end time
        return convertTimeToMinutes(a.endTime) - convertTimeToMinutes(b.endTime);
    });

    const user = req.session.user;

    const upcomingReservations = reservations
        .filter(reservation => {
            const now = new Date();
            const reservationDateTime = new Date(reservation.reservationDate);

            const reservationTime = convertTo24Hour(reservation.startTime);
            if(!reservationTime) return false;
            
            reservationDateTime.setHours(reservationTime.hours, reservationTime.minutes, 0, 0);

            return reservationDateTime > now;
        })
        .sort((one, two) => {
            const dateOne = new Date(one.reservationDate);
            const dateTwo = new Date(two.reservationDate);

            const timeOne = convertTo24Hour(one.startTime);
            const timeTwo = convertTo24Hour(two.startTime);

            dateOne.setHours(timeOne.hours, timeOne.minutes, 0, 0);
            dateTwo.setHours(timeTwo.hours, timeTwo.minutes, 0, 0);

            return dateOne - dateTwo;
        })

    let upcomingLab = "No upcoming reservations.";

    if(upcomingReservations.length > 0){
        upcomingLab = `${upcomingReservations[0].laboratoryRoom} on ${new Date(upcomingReservations[0].reservationDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} at ${upcomingReservations[0].startTime}`;
    }

    // format data passed for display
    const formattedReservations = reservations.map(reservation => {
        return {
            lab: reservation.laboratoryRoom,
            date: reservation.reservationDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            time: reservation.startTime + " - " + reservation.endTime,
            seat: reservation.seatNumber,
            status: getStatus(reservation)
        };
    });
    
    // Render profile with data
    res.render("labtech-profile", { upcomingLab, reservations: formattedReservations, user });
});


// Profile Section Routes - Using route parameters for cleaner code
app.get("/profile-:section", isAuth, (req, res) => {
    const section = req.params.section;
    const validSections = {
        'overview': '#overview',
        'account': '#dashboard',
        'edit': '#edit',
        'delete': '#delete'
    };
    
    const hash = validSections[section] || '';
    res.redirect(`/student-profile${hash}`);
});

// User Profiles

// Generate popup profile with related user data
app.get("/profile/:id", async (req, res) => {
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
            image: user.image,
            email: user.email,
            biography: user.biography,
            department: user.department,
            type: user.type
        };
        
        res.render("popup-profile", {userData});

    } catch (error) {
        console.error(`Error finding user: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

// Labtech Profile Section Routes
app.get("/labtech-profile-:section", isAuth, (req, res) => {
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


// API endpoint to check seat availability
app.get("/api/reservations/check-availability", async (req, res) => {
    try {
        const { lab, date, seatNumber, startTime, endTime } = req.query;
        
        // Validate inputs
        if (!lab || !date || !seatNumber || !startTime || !endTime) {
            return res.status(400).json({ available: false, message: "All parameters are required" });
        }
        
        // Check if there's already a reservation for this seat, date, and time
        const existingReservation = await Reservation.findOne({
            laboratoryRoom: lab,
            seatNumber: parseInt(seatNumber),
            reservationDate: date,
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

// API endpoint to get a specific lab by name
app.get("/api/laboratories/:room", async (req, res) => {
    try {
        const { room } = req.params; 
        const laboratory = await Laboratory.findOne({ room });

        if (!laboratory) {
            return res.status(404).json({ message: "Laboratory not found" });
        }

        res.json(laboratory);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
;

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
            laboratoryRoom: lab.room,
            reservationDate: {
                $gte: startDate,
                $lt: endDate
            }
        }).populate('userId', 'firstName lastName image type');
        
        console.log(`Found ${reservations.length} reservations`);
        
        // Format the reservations for the response
        const formattedReservations = reservations.map(reservation => ({
            _id: reservation._id,
            seatNumber: reservation.seatNumber,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            userId: reservation.userId,
            studentName: reservation.studentName,
            isAnonymous: reservation.isAnonymous,
        }));
        
        res.json({ reservations: formattedReservations });
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ error: "An error occurred while fetching reservations" });
    }
});

// Create a new reservation
app.post("/create-reservation", isAuth, async (req, res) => {
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
            laboratoryRoom: lab.room,
            seatNumber: parseInt(seatNumber),
            reservationDate: reservationDate,
            startTime: startTime
        });
        
        if (existingReservation) {
            return res.status(400).send("This seat is already reserved for the selected time");
        }

        const user = await User.findById(userId);

        // Create and save the new reservation
        const newReservation = new Reservation({
            userId,
            studentName: `${user.firstName} ${user.lastName}`,
            laboratoryRoom: lab.room,
            seatNumber: parseInt(seatNumber),
            bookingDate: new Date(),
            reservationDate: reservationDate,
            startTime,
            endTime,
            isAnonymous
        });
        
        await newReservation.save();
        
        // Redirect to student-reservations.html after successful booking
        res.redirect('/student-reservations');
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).send("An error occurred while creating the reservation");
    }
});

// Create a new reservation as labtech
app.post("/create-reservation-labtech", isAuth, async (req, res) => {
    try {
        const { labId, date, seatNumber, startTime, endTime, userId} = req.body;
        
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
            laboratoryRoom: lab.room,
            seatNumber: parseInt(seatNumber),
            reservationDate: reservationDate,
            startTime: startTime
        });
        
        if (existingReservation) {
            return res.status(400).send("This seat is already reserved for the selected time");
        }
        
        const user = await User.findById(userId);

        // Create and save the new reservation
        const newReservation = new Reservation({
            userId,
            studentName: user.firstName + " " + user.lastName,
            laboratoryRoom: lab.room,
            seatNumber: parseInt(seatNumber),
            bookingDate: new Date(),
            reservationDate: reservationDate,
            startTime,
            endTime,
        });
        
        await newReservation.save();
    
        // Redirect to labtech-reservations.html after successful booking
        res.redirect('/labtech-reservations');
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).send("An error occurred while creating the reservation");
    }
});

// Helper Functions
function convertTimeToMinutes(timeString) {
    const [time, modifier] = timeString.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "P.M." && hours !== 12) hours += 12;
    if (modifier === "A.M." && hours === 12) hours = 0;

    return hours * 60 + minutes; 
}

function convertTo24Hour(timeStr){
    const match = timeStr.match(/(\d+):(\d+) (\w+\.?\w*)/);

    if(!match)
        return null;

    let [_, hours, minutes, period] = match;
    hours = Number(hours);
    minutes = Number(minutes);

    if(period.toUpperCase().includes("P") && hours !== 12){
        hours += 12;
    } else if (period.toUpperCase().includes("A") && hours === 12) {
        hours = 0;
    }

    return {hours, minutes};
}

// checks for past reservations and delete if there is any every half hour (30 minutes)
function runAtNextHalfHour() {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const millisToNextHalfHour= (30 - minutes % 30) * 60 * 1000 - seconds * 1000;

    deletePastReservations(); // at start of program, delete past reservations if any

    setTimeout(() => {
        deletePastReservations();
        setInterval(deletePastReservations, 30*60*1000);
    }, millisToNextHalfHour);
}

runAtNextHalfHour();

function convertToHour(time12h) {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");
 
    if (modifier === "P.M." && hours !== "12") {
        hours = String(parseInt(hours, 10) + 12);
    } else if (modifier === "A.M." && hours === "12") {
        hours = "00";
    }
 
    return `${hours}:${minutes}`;
}
 
function timeToNumber(timeStr) {
    return parseInt(timeStr.replace(':', ''), 10);
}

function getStatus(reservation){
        const reserveDate = new Date(reservation.reservationDate);
        const reservationDate = reserveDate.getFullYear() + '-' + String(reserveDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(reserveDate.getDate()).padStart(2, '0'); // replaced toISOString() since it always converts the time to UTC
        var statusText = "";
        const now = new Date();
        const todayDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0'); // replaced toISOString() since it always converts the time to UTC
        var statusText = "";

        // get reservation start and end times
        const startTime = timeToNumber(convertToHour(reservation.startTime));
        const endTime = timeToNumber(convertToHour(reservation.endTime));

        // get current time
        const nowHours = now.getHours().toString().padStart(2, '0');
        const nowMinutes = now.getMinutes().toString().padStart(2, '0');
        const nowTime = parseInt(`${nowHours}${nowMinutes}`, 10);

        if (todayDate === reservationDate && nowTime >= startTime && nowTime < endTime) {
            statusText = "Ongoing";
        } else {
            statusText = "Upcoming";
        }

        return statusText;
    
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
