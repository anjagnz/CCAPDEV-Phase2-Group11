const mongoose = require('mongoose');
const User = require('./models/User');
const LabTech = require('./models/Labtech');
const Laboratory = require('./models/Laboratory');
const TimeSlot = require('./models/TimeSlot');

// Connect to MongoDB
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
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        biography: 'Computer Science student with a passion for web development and AI.',
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'password123',
        biography: 'Biology major focusing on molecular genetics and biotechnology.',
        department: 'Biology'
    },
    {
        type: 'Student',
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex.johnson@example.com',
        password: 'password123',
        biography: 'Physics student researching quantum mechanics and particle physics.',
        department: 'Physics'
    },
    {
        type: 'Student',
        firstName: 'Emily',
        lastName: 'Brown',
        email: 'emily.brown@example.com',
        password: 'password123',
        biography: 'Chemistry student specializing in organic chemistry and material science.',
        department: 'Chemistry'
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
        firstName: 'Robert',
        lastName: 'Williams',
        email: 'robert.williams@example.com',
        password: 'password123',
        biography: 'Senior lab technician with 10+ years of experience in computer science laboratories.',
        department: 'Computer Science',
        laboratories: []
    },
    {
        type: 'Faculty',
        firstName: 'Sarah',
        lastName: 'Davis',
        email: 'sarah.davis@example.com',
        password: 'password123',
        biography: 'Lab technician specializing in molecular biology and genetic engineering techniques.',
        department: 'Biology',
        laboratories: []
    },
    {
        type: 'Faculty',
        firstName: 'Michael',
        lastName: 'Wilson',
        email: 'michael.wilson@example.com',
        password: 'password123',
        biography: 'Physics lab technician with expertise in experimental physics and equipment maintenance.',
        department: 'Physics',
        laboratories: []
    },
    {
        type: 'Faculty',
        firstName: 'Lisa',
        lastName: 'Taylor',
        email: 'lisa.taylor@example.com',
        password: 'password123',
        biography: 'Chemistry lab technician specializing in analytical techniques and laboratory safety.',
        department: 'Chemistry',
        laboratories: []
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

        // Insert demo students
        await User.insertMany(demoStudents);
        console.log('Demo students added');

        // Insert demo lab techs
        await LabTech.insertMany(demoLabTechs);
        console.log('Demo lab technicians added');

        // Insert demo laboratories
        const insertedLabs = await Laboratory.insertMany(demoLaboratories);
        console.log('Demo laboratories added');

        // Create demo time slots
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

// Run the seed function
seedDatabase();
