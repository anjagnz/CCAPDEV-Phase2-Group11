const mongoose = require('mongoose');
const argon2 = require('argon2');
const User = require('./models/User');
const Laboratory = require('./models/Laboratory');
const TimeSlot = require('./models/TimeSlot');
const { seedReservations } = require('./seedReservations'); // js for reservations

mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost/LabMateDB')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Demo student profiles
const demoStudents = [
    {
        type: 'Student',
        firstName: 'Student',
        lastName: 'Student',
        email: 'student@dlsu.edu.ph',
        department: 'Computer Science',
        biography: 'Student',
        image: "/uploads/profile-1.jpg",
        password: 'student',
    },
    {
        type: 'Student',
        firstName: 'Angelo',
        lastName: 'Rocha',
        email: 'angelo_rocha@dlsu.edu.ph',
        password: '345',
        biography: 'idk what to put here',
        image: "/uploads/profile-2.jpg",
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Grass',
        lastName: 'Capote',
        email: 'mary_grace_capote@dlsu.edu.ph',
        password: '456',
        biography: 'send help',
        image: "/uploads/profile-3.jpg",
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Anja',
        lastName: 'Gonzales',
        email: 'anja_gonzales@dlsu.edu.ph',
        password: '234',
        biography: 'i need sleep',
        image: "/uploads/profile-4.jpg",
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Liana',
        lastName: 'Ho',
        email: 'denise_liana_ho@dlsu.edu.ph',
        password: '123',
        biography: 'idk stream tsunami sea yeah',
        image: "/uploads/profile-5.jpg",
        department: 'Computer Science'
    }
];

// Demo lab technician profiles
const demoLabTechs = [
    {
        type: 'Faculty',
        firstName: 'Charlie',
        lastName: 'Caronongan',
        email: 'faculty@dlsu.edu.ph',
        password: 'faculty',
        department: 'Computer Science',
        biography: 'Lab technician for DLSU. No, I am not a dog...',
        image: "/uploads/charlie.jpg",
        department: 'Computer Science',
    },
    {
        type: 'Faculty',
        firstName: 'Noah',
        lastName: 'Davis',
        email: 'noah_davis@dlsu.edu.ph',
        department: 'Computer Science',
        biography: "I am a professor.",
        image: "/uploads/noah.jpg",
        password: 'password123',
    },
    {
        type: 'Faculty',
        firstName: 'Michael',
        lastName: 'Myers',
        email: 'michael_myers@dlsu.edu.ph',
        biography: "*intense breathing in and out from mask sounds*",
        image: "/uploads/michael.jpg",
        password: 'password123',
    },
    {
        type: 'Faculty',
        firstName: 'Admin',
        lastName: 'Admin',
        email: 'admin@dlsu.edu.ph',
        biography: "Admin",
        password: 'admin',
    },
];

// Demo laboratories
const demoLaboratories = [
    {
        hall: 'Gokongwei Hall',
        room: 'GK404B',
        capacity: 20
    },
    {
        hall: 'Br. Andrew Gonzales Hall',
        room: 'AG1904',
        capacity: 40
    },
    {
        hall: 'Gokongwei Hall',
        room: 'GK201A',
        capacity: 20
    },
    {
        hall: 'Br. Andrew Gonzales Hall',
        room: 'AG1706',
        capacity: 40
    },
    {
        hall: 'Gokongwei Hall',
        room: 'GK302A',
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
        await Laboratory.deleteMany({});
        await TimeSlot.deleteMany({});
        
        console.log('Previous data cleared');

        // Hash all passwords
        for (const student of demoStudents) {
            student.password = await argon2.hash(student.password);
        }

        for (const labtech of demoLabTechs) {
            labtech.password = await argon2.hash(labtech.password);
        }

        // Insert new demo data
        await User.insertMany(demoStudents);
        console.log('Demo students added');

        await User.insertMany(demoLabTechs);
        console.log('Demo lab technicians added');

        const insertedLabs = await Laboratory.insertMany(demoLaboratories);
        console.log('Demo laboratories added');

        const timeSlots = [];
        const today = new Date(); // Get today's date

        // Create the time slots for the next 7 days
        insertedLabs.forEach(lab => {
            for (let i = 0; i <= 7; i++) {  
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i); // Increment by i days
                
                // Loop for seat numbers 1-5
                for (let j = 1; j <= 5; j++) {
                    const slots = [
                        { seatNumber: j, time: '07:30 AM - 08:00 AM' },
                        { seatNumber: j, time: '08:00 AM - 8:30 AM' },
                        { seatNumber: j, time: '08:30 AM - 09:00 AM' },
                        { seatNumber: j, time: '09:30 AM - 10:00 AM' },
                        { seatNumber: j, time: '010:00 AM - 11:00 AM' },
                        { seatNumber: j, time: '11:00 AM - 11:30 AM' },
                        { seatNumber: j, time: '11:30 AM - 12:00 PM' }
                    ];

                    // Add time slots for the current lab and date
                    for (const slot of slots) {
                        timeSlots.push({
                            laboratoryRoom: lab.room,
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

        // seed reservations once users, labs, timeslots are added
        await seedReservations();
        console.log('Demo reservations added');

        console.log('Database seeded successfully');

        mongoose.disconnect();
        process.exit()
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

seedDatabase();
