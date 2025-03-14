// labtechProfile.js - JavaScript for Lab Technician Profile functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a labtech profile page
    const isLabtechProfilePage = window.location.pathname.includes('labtech-profile');
    
    if (isLabtechProfilePage) {
        setupProfileFunctionality();
    }
    
    // Setup event listeners for reservation management if on reservations page
    const isReservationsPage = window.location.pathname.includes('labtech-reservations');
    if (isReservationsPage) {
        setupReservationManagement();
    }
    
    // Setup event listeners for laboratory management if on laboratories page
    const isLaboratoriesPage = window.location.pathname.includes('labtech-laboratories');
    if (isLaboratoriesPage) {
        setupLaboratoryManagement();
    }
    
    // Call setupSeatColors when the DOM is fully loaded
    setupSeatColors();
});

function setupProfileFunctionality() {
    // Handle profile image upload
    const profileImageInput = document.getElementById('profile-image-input');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', handleProfileImageUpload);
    }
    
    // Handle profile edit form submission
    const profileEditForm = document.getElementById('profile-edit-form');
    if (profileEditForm) {
        profileEditForm.addEventListener('submit', handleProfileEditSubmit);
    }
    
    // Handle account deletion confirmation
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', confirmAccountDeletion);
    }
}

function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.querySelector('.profile-picture-large img').src = e.target.result;
            
            // Here you would typically upload the image to the server
            // This is a placeholder for the actual implementation
            console.log('Image would be uploaded to server');
        };
        reader.readAsDataURL(file);
    }
}

function handleProfileEditSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const profileData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        department: formData.get('department'),
        biography: formData.get('biography')
    };
    
    // Here you would typically send the data to the server
    // This is a placeholder for the actual implementation
    console.log('Profile data would be sent to server:', profileData);
    
    // Show success message
    alert('Profile updated successfully!');
}

function confirmAccountDeletion() {
    const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    
    if (confirmDelete) {
        // Here you would typically send a request to delete the account
        // This is a placeholder for the actual implementation
        console.log('Account would be deleted');
        
        // Redirect to homepage or login page
        window.location.href = '/';
    }
}

function setupReservationManagement() {
    // Add event listeners to approve/reject buttons
    const approveButtons = document.querySelectorAll('.approve-btn');
    const rejectButtons = document.querySelectorAll('.reject-btn');
    
    approveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reservationId = this.getAttribute('data-reservation-id');
            approveReservation(reservationId);
        });
    });
    
    rejectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reservationId = this.getAttribute('data-reservation-id');
            rejectReservation(reservationId);
        });
    });
}

function approveReservation(reservationId) {
    // Here you would typically send a request to approve the reservation
    console.log('Approving reservation:', reservationId);
    
    // Update UI to reflect the change
    const statusCell = document.querySelector(`[data-reservation-id="${reservationId}"]`).closest('tr').querySelector('.status');
    if (statusCell) {
        statusCell.textContent = 'Approved';
        statusCell.classList.add('approved');
    }
}

function rejectReservation(reservationId) {
    // Here you would typically send a request to reject the reservation
    console.log('Rejecting reservation:', reservationId);
    
    // Update UI to reflect the change
    const statusCell = document.querySelector(`[data-reservation-id="${reservationId}"]`).closest('tr').querySelector('.status');
    if (statusCell) {
        statusCell.textContent = 'Rejected';
        statusCell.classList.add('rejected');
    }
}

function setupLaboratoryManagement() {
    // Add event listeners for laboratory management
    const addLabForm = document.getElementById('add-laboratory-form');
    if (addLabForm) {
        addLabForm.addEventListener('submit', handleAddLaboratory);
    }
    
    const editLabButtons = document.querySelectorAll('.edit-lab-btn');
    editLabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const labId = this.getAttribute('data-lab-id');
            openEditLaboratoryForm(labId);
        });
    });
    
    const deleteLabButtons = document.querySelectorAll('.delete-lab-btn');
    deleteLabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const labId = this.getAttribute('data-lab-id');
            confirmLaboratoryDeletion(labId);
        });
    });
}

function handleAddLaboratory(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const labData = {
        name: formData.get('lab-name'),
        location: formData.get('lab-location'),
        capacity: formData.get('lab-capacity'),
        description: formData.get('lab-description')
    };
    
    // Here you would typically send the data to the server
    console.log('Laboratory data would be sent to server:', labData);
    
    // Show success message
    alert('Laboratory added successfully!');
    
    // Reset form
    event.target.reset();
}

function openEditLaboratoryForm(labId) {
    // This function would open a form to edit the laboratory
    console.log('Opening edit form for laboratory:', labId);
    
    // In a real implementation, you would fetch the laboratory data
    // and populate the form fields
}

function confirmLaboratoryDeletion(labId) {
    const confirmDelete = confirm('Are you sure you want to delete this laboratory? This action cannot be undone.');
    
    if (confirmDelete) {
        // Here you would typically send a request to delete the laboratory
        console.log('Laboratory would be deleted:', labId);
        
        // Update UI to reflect the change
        const labRow = document.querySelector(`[data-lab-id="${labId}"]`).closest('tr');
        if (labRow) {
            labRow.remove();
        }
    }
}

function setupSeatColors() {
    // Example: Assume each seat is a div with class 'seat' and data attribute 'status'
    const seats = document.querySelectorAll('.seat');
    seats.forEach(seat => {
        const status = seat.getAttribute('data-status');
        switch (status) {
            case 'available':
                seat.style.backgroundColor = 'green';
                break;
            case 'occupied':
                seat.style.backgroundColor = 'red';
                break;
            case 'reserved':
                seat.style.backgroundColor = 'yellow';
                break;
            default:
                seat.style.backgroundColor = 'gray';
        }
    });
}
