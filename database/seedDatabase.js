const mongoose = require('mongoose');
const User = require('./models/User');
const LabTech = require('./models/Labtech');
const Laboratory = require('./models/Laboratory');
const TimeSlot = require('./models/TimeSlot');

mongoose.connect('mongodb://localhost/LabMateDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Demo student profiles
const demoStudents = [
    {
        type: 'Student',
        firstName: 'Student',
        lastName: 'Student',
        email: 'student@dlsu.edu.ph',
        password: 'student',
    },
    {
        type: 'Student',
        firstName: 'Angelo',
        lastName: 'Rocha',
        email: 'angelo_rocha@dlsu.edu.ph',
        password: '345',
        biography: 'idk what to put here',
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Grass',
        lastName: 'Capote',
        email: 'mary_grace_capote@dlsu.edu.ph',
        password: '456',
        biography: 'send help',
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Anja',
        lastName: 'Gonzales',
        email: 'anja_gonzales@dlsu.edu.ph',
        password: '234',
        biography: 'i need sleep',
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Liana',
        lastName: 'Ho',
        email: 'denise_liana_ho@dlsu.edu.ph',
        password: '123',
        biography: 'idk stream tsunami sea yeah',
        department: 'Computer Science'
    }
];

// Demo lab technician profiles
const demoLabTechs = [
    {
        type: 'Faculty',
        firstName: 'Faculty',
        lastName: 'Faculty',
        email: 'faculty@dlsu.edu.ph',
        password: 'faculty',
        biography: 'Lab technician for DLSU.',
        department: 'Computer Science',
    },
    {
        type: 'Faculty',
        firstName: 'Noah',
        lastName: 'Davis',
        email: 'noah_davis@dlsu.edu.ph',
        password: 'password123',
    },
    {
        type: 'Faculty',
        firstName: 'Michael',
        lastName: 'Myers',
        email: 'michael_myers@dlsu.edu.ph',
        password: 'password123',
    },
    {
        type: 'Faculty',
        firstName: 'Lisa',
        lastName: 'Taylor',
        email: 'lisa_taylor@dlsu.edu.ph',
        password: 'password123',
    },
    {
        type: 'Faculty',
        firstName: 'The',
        lastName: 'Goat',
        email: 'the_goat@dlsu.edu.ph',
        password: 'admin',
        department: 'Computer Science'
    }
];

// Demo laboratories
const demoLaboratories = [
    {
        laboratoryName: 'GK404B',
        capacity: 20
    },
    {
        laboratoryName: 'AG1904',
        capacity: 40
    },
    {
        laboratoryName: 'GK201A',
        capacity: 20
    },
    {
        laboratoryName: 'AG1706',
        capacity: 40
    },
    {
        laboratoryName: 'GK302A',
        capacity: 20
    }
];

// Function to create a date object for a specific day
const createDate = (day) => {
    const date = new Date();
    date.setDate(day);
    date.setHours(0, 0, 0, 0);
    return date;
};

const seedDatabase = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await LabTech.deleteMany({});
        await Laboratory.deleteMany({});
        await TimeSlot.deleteMany({});
        
        console.log('Previous data cleared');

        // Insert new demo data
        await User.insertMany(demoStudents);
        console.log('Demo students added');

        await LabTech.insertMany(demoLabTechs);
        console.log('Demo lab technicians added');

        const insertedLabs = await Laboratory.insertMany(demoLaboratories);
        console.log('Demo laboratories added');

        const timeSlots = [];
        const today = new Date(); // Get today's date

        // Create the time slots for the next 7 days
        insertedLabs.forEach(lab => {
            for (let i = 0; i < 7; i++) {  
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i); // Increment by i days
                
                // Loop for seat numbers 1-5
                for (let j = 1; j <= 5; j++) {
                    const slots = [
                        { seatNumber: j, time: '7:30 AM - 8:00 AM' },
                        { seatNumber: j, time: '8:00 AM - 8:30 AM' },
                        { seatNumber: j, time: '8:30 AM - 9:00 AM' },
                        { seatNumber: j, time: '9:30 AM - 10:00 AM' },
                        { seatNumber: j, time: '10:00 AM - 11:00 AM' },
                        { seatNumber: j, time: '11:00 AM - 11:30 AM' },
                        { seatNumber: j, time: '11:30 AM - 12:00 PM' }
                    ];

                    // Add time slots for the current lab and date
                    for (const slot of slots) {
                        timeSlots.push({
                            laboratoryRoom: lab.laboratoryName,
                            seatNumber: slot.seatNumber,
                            date: new Date(currentDate),
                            time: slot.time,
                            isAvailable: true,
                        });
                    }
                }
            }
        })

        await TimeSlot.insertMany(timeSlots);
        console.log('Demo time slots added');

        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

seedDatabase();
