const mongoose = require('mongoose');
const User = require('./models/User');
const Laboratory = require('./models/Laboratory');
const Reservation = require('./models/Reservation');

// Time slots available for reservations
const timeSlots = [
    '07:30 A.M.', '08:00 A.M.', '08:30 A.M.', '09:00 A.M.', '09:30 A.M.', 
    '10:00 A.M.', '10:30 A.M.', '11:00 A.M.', '11:30 A.M.', '12:00 P.M.', 
    '12:30 P.M.', '01:00 P.M.', '01:30 P.M.', '02:00 P.M.', '02:30 P.M.',
    '03:00 P.M.', '03:30 P.M.', '04:00 P.M.', '04:30 P.M.'
];

// Function to generate a random end time based on start time
const generateEndTime = (startTime) => {
    // Parse the time
    const timeRegex = /(\d+):(\d+)\s+(A\.M\.|P\.M\.)/;
    const match = startTime.match(timeRegex);
    
    if (!match) return startTime; // Return original if no match
    
    let [_, hour, minute, period] = match;
    hour = parseInt(hour);
    minute = parseInt(minute);
    
    // Generate random duration in 30-minute blocks (1-4 blocks = 30min to 2 hours)
    const blocks = Math.floor(Math.random() * 4) + 1;
    
    // Add the random duration
    for (let i = 0; i < blocks; i++) {
        if (minute === 30) {
            hour += 1;
            minute = 0;
        } else {
            minute = 30;
        }
        
        // Handle period change
        if (hour === 12 && minute === 0 && period === 'A.M.') {
            period = 'P.M.';
        } else if (hour === 12 && minute === 0 && period === 'P.M.') {
            period = 'A.M.';
            hour = 1;
        } else if (hour > 12) {
            hour -= 12;
            if (period === 'A.M.') period = 'P.M.';
        }
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
            throw new Error('No users found in the database');
        }
        
        if (labs.length === 0) {
            throw new Error('No laboratories found in the database');
        }
        
        console.log(`Found ${users.length} users and ${labs.length} laboratories`);
        
        const reservations = [];
        
        // current date based on when run
        const currentDate = new Date();
        
        // create reservations from 2 days ago to 7 days ahead
        for (let day = -2; day <= 7; day++) {
            const reservationDate = new Date(currentDate);
            reservationDate.setDate(currentDate.getDate() + day);
            reservationDate.setHours(0, 0, 0, 0);
            
            // Create 5 reservations per day
            for (let i = 0; i < 5; i++) {
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
    } catch (error) {
        console.error('Error seeding reservations:', error);
        throw error;
    }
};

module.exports = { seedReservations };
