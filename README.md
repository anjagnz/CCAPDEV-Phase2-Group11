CCAPDEV - S16 (Capote, Gonzales, Ho, Rocha)

# How to Run the Application

To start the application, simply run the `start-app.bat` file located in the root directory of the project.

This will automatically set up the environment and start the server for you.


# Demo Profiles

## Signing in

To test student-related views and facilities, use the following account credentials upon sign-in:
* Email: student@dlsu.edu.ph
* Password: student

To test faculty (lab technician) views and facilities, use the following account credentials upon sign-in:
* Email: admin@dlsu.edu.ph
* Password: admin

# Signing up

To test student / faculty views and facilities via a newly created user account, navigate to "Sign Up" to create a new account. Take note that the following has been implemented:
* Simple input checking (i.e., passwords don't match, field missing, etc.) to test error message outputting
* Checking new email against existing accounts as to not disrupt logic for fetching user data from database
* Creating faculty (lab technician) account requires a faculty code to proceed. As of this implementation, the code is "i-am-faculty"