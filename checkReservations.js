const mongoose = require('mongoose');
const Reservation = require('./database/models/Reservation');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost/LabMateDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Function to check reservations
const checkReservations = async () => {
    try {
        // Get all reservations
        const reservations = await Reservation.find({}).limit(5);
        
        console.log('Sample reservations:');
        reservations.forEach(reservation => {
            console.log({
                id: reservation._id,
                lab: reservation.laboratoryRoom,
                seat: reservation.seatNumber,
                date: reservation.reservationDate,
                startTime: reservation.startTime,
                endTime: reservation.endTime,
                isAnonymous: reservation.isAnonymous
            });
        });
        
        // Count reservations by lab
        const labCounts = await Reservation.aggregate([
            { $group: { _id: "$laboratoryRoom", count: { $sum: 1 } } }
        ]);
        
        console.log('\nReservation counts by lab:');
        labCounts.forEach(lab => {
            console.log(`${lab._id}: ${lab.count} reservations`);
        });
        
        // Count reservations by date
        const dateCounts = await Reservation.aggregate([
            { 
                $group: { 
                    _id: { 
                        $dateToString: { 
                            format: "%Y-%m-%d", 
                            date: "$reservationDate" 
                        } 
                    }, 
                    count: { $sum: 1 } 
                } 
            },
            { $sort: { "_id": 1 } }
        ]);
        
        console.log('\nReservation counts by date:');
        dateCounts.forEach(date => {
            console.log(`${date._id}: ${date.count} reservations`);
        });
        
        mongoose.connection.close();
    } catch (error) {
        console.error('Error checking reservations:', error);
        mongoose.connection.close();
    }
};

// Run the function
checkReservations();
