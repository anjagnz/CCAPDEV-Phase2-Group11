const mongoose = require('mongoose');
const UserModel = require('./models/User');
const LabTechModel = require('./models/labtech');
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
        image: 'img/profile1.jpg',
        email: 'john.doe@example.com',
        password: 'password123',
        biography: 'Computer Science student with a passion for web development and AI.',
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Jane',
        lastName: 'Smith',
        image: 'img/profile2.jpg',
        email: 'jane.smith@example.com',
        password: 'password123',
        biography: 'Biology major focusing on molecular genetics and biotechnology.',
        department: 'Biology'
    },
    {
        type: 'Student',
        firstName: 'Alex',
        lastName: 'Johnson',
        image: 'img/profile3.jpg',
        email: 'alex.johnson@example.com',
        password: 'password123',
        biography: 'Physics student researching quantum mechanics and particle physics.',
        department: 'Physics'
    },
    {
        type: 'Student',
        firstName: 'Emily',
        lastName: 'Brown',
        image: 'img/profile4.jpg',
        email: 'emily.brown@example.com',
        password: 'password123',
        biography: 'Chemistry student specializing in organic chemistry and material science.',
        department: 'Chemistry'
    },
    {
        type: 'Student',
        firstName: 'Anja',
        lastName: 'Gonzales',
        image: 'img/demo_data/ayase.jpg',
        email: 'anja_gonzales@dlsu.edu.ph',
        password: '234',
        biography: 'i need sleep',
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Liana',
        lastName: 'Ho',
        image: 'img/demo_data/sonoda.jpg',
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
        image: 'img/labtech1.jpg',
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
        image: 'img/labtech2.jpg',
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
        image: 'img/labtech3.jpg',
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
        image: 'img/labtech4.jpg',
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
        image: 'img/demo_data/kotori.jpg',
        email: 'the_goat@dlsu.edu.ph',
        password: 'admin',
        department: 'Computer Science'
    }
];

// Demo laboratories
const demoLaboratories = [
    {
        laboratoryName: 'G301',
        capacity: 30
    },
    {
        laboratoryName: 'G302',
        capacity: 25
    },
    {
        laboratoryName: 'G303',
        capacity: 20
    },
    {
        laboratoryName: 'G304',
        capacity: 35
    },
    // Adding the additional labs from index.js
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

// Seed the database
const seedDatabase = async () => {
    try {
        // Clear existing data
        await UserModel.deleteMany({});
        await LabTechModel.deleteMany({});
        await Laboratory.deleteMany({});
        await TimeSlot.deleteMany({});
        
        console.log('Previous data cleared');
        
        // Insert demo students
        const insertedStudents = await UserModel.insertMany(demoStudents);
        console.log('Demo students added');
        
        // Insert demo lab techs
        const insertedLabTechs = await LabTechModel.insertMany(demoLabTechs);
        console.log('Demo lab technicians added');
        
        // Insert demo laboratories
        const insertedLabs = await Laboratory.insertMany(demoLaboratories);
        console.log('Demo laboratories added');
        
        // Create demo time slots
        const timeSlots = [];
        
        // Get references to inserted students for reservations
        const anjaUser = insertedStudents.find(s => s.firstName === 'Anja');
        const lianaUser = insertedStudents.find(s => s.firstName === 'Liana');
        
        // For each lab, create some time slots
        for (const lab of insertedLabs) {
            // Create time slots for February 15, 2025
            const feb15 = createDate(15);
            feb15.setMonth(1); // February (0-indexed)
            feb15.setFullYear(2025);
            
            // Morning slots
            timeSlots.push({
                laboratoryId: lab._id,
                seatNumber: 1,
                date: new Date(feb15),
                time: '8:30 AM - 9:00 AM',
                isAvailable: false,
                userId: anjaUser._id
            });
            
            timeSlots.push({
                laboratoryId: lab._id,
                seatNumber: 2,
                date: new Date(feb15),
                time: '9:30 AM - 10:00 AM',
                isAvailable: false,
                userId: null // Anonymous user
            });
            
            timeSlots.push({
                laboratoryId: lab._id,
                seatNumber: 3,
                date: new Date(feb15),
                time: '10:00 AM - 11:00 AM',
                isAvailable: false,
                userId: lianaUser._id
            });
            
            // Add some available slots
            timeSlots.push({
                laboratoryId: lab._id,
                seatNumber: 4,
                date: new Date(feb15),
                time: '11:00 AM - 12:00 PM',
                isAvailable: true,
                userId: null
            });
            
            timeSlots.push({
                laboratoryId: lab._id,
                seatNumber: 5,
                date: new Date(feb15),
                time: '1:00 PM - 2:00 PM',
                isAvailable: true,
                userId: null
            });
        }
        
        await TimeSlot.insertMany(timeSlots);
        console.log('Demo time slots added');
        
        console.log('Database seeded successfully');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding database:', error);
        mongoose.connection.close();
    }
};

// Run the seed function
seedDatabase();
