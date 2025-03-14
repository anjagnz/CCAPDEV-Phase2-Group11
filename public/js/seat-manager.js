document.addEventListener('DOMContentLoaded', function() {
    initializeSeats();
    setupEventListeners();
    populateDates();
    setupAnonymousOption();
});

function setupEventListeners() {
    const labSelect = document.getElementById('labs');
    const dateSelect = document.getElementById('dates');
    
    if (labSelect) {
        labSelect.addEventListener('change', updateSeatStatus);
    }
    if (dateSelect) {
        dateSelect.addEventListener('change', updateSeatStatus);
    }
}

function setupAnonymousOption() {
    const userId = localStorage.getItem('userId');
    const anonymousOption = document.getElementById('anonymous-option');
    
    if (userId && anonymousOption) {
        anonymousOption.style.display = 'flex';
        anonymousOption.classList.add('visible');
    }
}

function populateDates() {
    const dateSelect = document.getElementById('dates');
    const today = new Date();
    
    // Add next 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const option = document.createElement('option');
        option.value = date.toISOString().split('T')[0];
        option.text = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        dateSelect.appendChild(option);
    }
}

function initializeSeats() {
    const seats = document.querySelectorAll('.clickable-seat, .taken-seat, .your-seat');
    const morningTimeSlots = [
        '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM'
    ];

    seats.forEach((seat, index) => {
        const seatNumber = Math.floor(index / morningTimeSlots.length) + 1;
        const timeSlot = morningTimeSlots[index % morningTimeSlots.length];
        seat.setAttribute('data-seat-number', seatNumber);
        seat.setAttribute('data-time-slot', timeSlot);
        
        if (seat.classList.contains('clickable-seat')) {
            seat.addEventListener('click', handleSeatClick);
        }
    });
}

function handleSeatClick(event) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Please sign in to select a seat');
        return;
    }

    // Remove any previously selected seats
    document.querySelectorAll('.selected-seat').forEach(seat => {
        seat.classList.remove('selected-seat');
        seat.classList.add('clickable-seat');
    });

    // Add selected class to clicked seat
    const seat = event.target;
    seat.classList.remove('clickable-seat');
    seat.classList.add('selected-seat');

    // Update end time options based on selected time slot
    updateEndTimeOptions(seat.getAttribute('data-time-slot'));
}

function updateEndTimeOptions(startTime) {
    const endTimeSelect = document.getElementById('endtimes');
    const morningTimeSlots = [
        '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM'
    ];
    
    // Clear existing options except the first one
    while (endTimeSelect.options.length > 1) {
        endTimeSelect.remove(1);
    }

    // Find start index and add subsequent time slots
    const startIndex = morningTimeSlots.indexOf(startTime);
    if (startIndex !== -1) {
        for (let i = startIndex + 1; i < morningTimeSlots.length; i++) {
            const option = document.createElement('option');
            option.value = morningTimeSlots[i];
            option.text = morningTimeSlots[i];
            endTimeSelect.appendChild(option);
        }
    }
}

function handleReservation() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Please sign in to make a reservation');
        return;
    }

    const selectedLab = document.getElementById('labs').value;
    const selectedDate = document.getElementById('dates').value;
    const selectedEndTime = document.getElementById('endtimes').value;
    const isAnonymous = document.getElementById('anonymous').checked;
    
    const selectedSeat = document.querySelector('.selected-seat');
    
    if (!selectedLab || !selectedDate || !selectedEndTime || !selectedSeat) {
        alert('Please select all required fields (laboratory, date, seat, and end time).');
        return;
    }

    const seatNumber = selectedSeat.getAttribute('data-seat-number');
    const startTime = selectedSeat.getAttribute('data-time-slot');

    // Create reservation data structure
    const reservationData = {
        userId: userId, // Using plain userId as per memory about plain text
        laboratoryRoom: selectedLab,
        seatNumber: parseInt(seatNumber),
        date: selectedDate,
        startTime: startTime,
        endTime: selectedEndTime,
        isAnonymous: isAnonymous,
        bookingDate: new Date().toISOString()
    };

    // Make reservation request
    fetch('/api/reservations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservationData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.reload();
        } else {
            alert(data.message || 'Failed to make reservation');
        }
    })
    .catch(error => {
        console.error('Error making reservation:', error);
        alert('Failed to make reservation. Please try again.');
    });
}

function updateSeatStatus() {
    const selectedLab = document.getElementById('labs').value;
    const selectedDate = document.getElementById('dates').value;
    
    // Only query the database when both lab and date are selected
    if (!selectedLab || selectedLab === "" || selectedLab === "disabled selected" || 
        !selectedDate || selectedDate === "" || selectedDate === "disabled selected") {
        return;
    }

    fetch(`/api/reservations/status?lab=${selectedLab}&date=${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            // Reset all seats to clickable first
            document.querySelectorAll('.taken-seat, .your-seat, .selected-seat').forEach(seat => {
                seat.className = 'clickable-seat';
                seat.onclick = handleSeatClick;
            });

            // Update seats based on reservations
            data.forEach(reservation => {
                const seatElement = document.querySelector(
                    `[data-seat-number="${reservation.seatNumber}"][data-time-slot="${reservation.startTime}"]`
                );
                
                if (seatElement) {
                    const isYourReservation = reservation.isCurrentUser;
                    updateSeatColor(seatElement, isYourReservation ? 'your-seat' : 'taken-seat');
                    
                    if (!isYourReservation) {
                        seatElement.onclick = () => togglePopup(`popup-frame-${reservation.seatNumber}`);
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching seat status:', error));
}

function updateSeatColor(seatElement, status) {
    seatElement.className = status;
    
    if (status === 'clickable-seat') {
        seatElement.onclick = handleSeatClick;
    } else if (status === 'taken-seat') {
        // Keep the existing popup toggle functionality
    }
}
