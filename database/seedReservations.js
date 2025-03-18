const mongoose = require('mongoose');
const User = require('./models/User');
const Laboratory = require('./models/Laboratory');
const Reservation = require('./models/Reservation');

// Connect to MongoDB
mongoose.connect('mongodb://localhost/LabMateDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Time slots available for reservations
const timeSlots = [
    '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', 
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', 
    '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
];

// Function to create a date object for a specific day
const createDate = (year, month, day) => {
    const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    date.setHours(0, 0, 0, 0);
    return date;
};

// Function to generate a random end time based on start time
const generateEndTime = (startTime) => {
    // Parse the time
    const timeRegex = /(\d+):(\d+)\s+(AM|PM)/;
    const match = startTime.match(timeRegex);
    
    if (!match) return startTime; // Return original if no match
    
    let [_, hour, minute, period] = match;
    hour = parseInt(hour);
    minute = parseInt(minute);
    
    // Add 30 minutes
    if (minute === 30) {
        hour += 1;
        minute = 0;
    } else {
        minute = 30;
    }
    
    // Handle period change
    if (hour === 12 && minute === 0 && period === 'AM') {
        period = 'PM';
    } else if (hour === 12 && minute === 0 && period === 'PM') {
        period = 'AM';
        hour = 1;
    } else if (hour > 12) {
        hour -= 12;
        if (period === 'AM') period = 'PM';
    }
    
    return `${hour}:${minute === 0 ? '00' : minute} ${period}`;
};

// Seed the database with reservations
const seedReservations = async () => {
    try {
        // Clear existing reservations
        await Reservation.deleteMany({});
        console.log('Previous reservations cleared');
        
        // Get all users and labs
        const users = await User.find({});
        const labs = await Laboratory.find({});
        
        if (users.length === 0) {
            console.error('No users found in the database. Please run seedDatabase.js first.');
            mongoose.connection.close();
            return;
        }
        
        if (labs.length === 0) {
            console.error('No laboratories found in the database. Please run seedDatabase.js first.');
            mongoose.connection.close();
            return;
        }
        
        console.log(`Found ${users.length} users and ${labs.length} laboratories`);
        
        const reservations = [];
        
        // Create reservations from March 15 to March 29, 2025
        for (let day = 15; day <= 29; day++) {
            const reservationDate = createDate(2025, 3, day); // March 2025
            
            // Create 15 reservations per day
            for (let i = 0; i < 15; i++) {
                // Randomly select a user, lab, seat, and time slot
                const randomUserIndex = Math.floor(Math.random() * users.length);
                const randomLabIndex = Math.floor(Math.random() * labs.length);
                const randomSeatNumber = Math.floor(Math.random() * 30) + 1; // Seats 1-30
                const randomTimeIndex = Math.floor(Math.random() * timeSlots.length);
                
                const user = users[randomUserIndex];
                const lab = labs[randomLabIndex];
                const startTime = timeSlots[randomTimeIndex];
                const endTime = generateEndTime(startTime);
                
                // Create a new reservation
                const reservation = {
                    userId: user._id,
                    studentName: `${user.firstName} ${user.lastName}`,
                    laboratoryRoom: lab.laboratoryName,
                    seatNumber: randomSeatNumber,
                    bookingDate: new Date(), // Current date as booking date
                    reservationDate: new Date(reservationDate),
                    startTime: startTime,
                    endTime: endTime,
                    isAnonymous: Math.random() > 0.8 // 20% chance of being anonymous
                };
                
                reservations.push(reservation);
            }
        }
        
        // Insert the reservations
        await Reservation.insertMany(reservations);
        console.log(`${reservations.length} demo reservations added`);
        
        console.log('Reservations seeded successfully');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding reservations:', error);
        mongoose.connection.close();
    }
};

// Run the seed function
seedReservations();
