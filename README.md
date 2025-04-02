CCAPDEV - S16 (Capote, Gonzales, Ho, Rocha)

Access the deployed website on https://ccapdev-group11-mco.onrender.com

# How to Run the Application

To start the application, follow the steps:
1. Initialize project folder as a Node project with `npm init -y`
2. Run the command `npm run demo` on the root directory of the project. This will install dependencies and run the application on [http://localhost:3000/](http://localhost:3000/).

Note that upon first run, the database will be automatically seeded with users, laboratories, and reservations. The database will automatically be seeded whenever there are no users and no laboratories.

## Signing in - Demo Profiles 

To test student-related views and facilities, use the following account credentials upon sign-in:
* Email: `student@dlsu.edu.ph`
* Password: `student`

To test faculty (lab technician) views and facilities, use the following account credentials upon sign-in:
* Email: `faculty@dlsu.edu.ph`
* Password: `faculty`

## Signing up

To test student / faculty views and facilities via a newly created user account, navigate to "Sign Up" to create a new account. Take note that the following has been implemented:
* Simple input checking (i.e., passwords don't match, field missing, etc.) to test error message outputting
* Checking new email against existing accounts as to not disrupt logic for fetching user data from database
* Creating faculty (lab technician) account requires a faculty code to proceed. As of this implementation, the code is "i-am-faculty"

# Notes on Implementation

## Reserving a Laboratory Seat

The **Laboratories page** allows users to view available slots, given the laboratory room and date. For a successful creation of a reservation:
1. A laboratory room and date must be selected
2. A seat number and start time must be selected under the Slot Availability view
3. A valid end time must be selected (which are already given in the dropdown)

Students may also view the details of an existing reservation in the Slot Availability view by clicking the red slot, and clicking the user's profile image, if given. Students cannot view the profile of anonymous reservations, as well as reservations booked by faculty member. Faculty members however may freely view profiles tied to existing reservations, whether it is anonymous or booked by another faculty member.

## Viewing Reservations

## Profile Page