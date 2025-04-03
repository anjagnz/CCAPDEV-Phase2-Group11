const mongoose = require('mongoose');
const argon2 = require('argon2');
const User = require('./models/User');
const Laboratory = require('./models/Laboratory');
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

        await Laboratory.insertMany(demoLaboratories);
        console.log('Demo laboratories added');

        // seed reservations once users and labs are added
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
