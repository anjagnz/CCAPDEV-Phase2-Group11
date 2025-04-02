// Function to load and display reservations
async function loadReservations() {
    try {
        // Get the current user ID from localStorage
        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.error('No user ID found in localStorage');
            alert('Please sign in to view your reservations');
            // Redirect to login page
            // window.location.href = '/signin-page';
            return;
        }

        // Fetch only the reservations of the logged in user
        const response = await fetch(`/api/reservations/user/${userId}`);
        const reservations = await response.json();

        const tableBody = document.querySelector("tbody");
        tableBody.innerHTML = ""; // Clear existing content

        reservations.forEach(reservation => {
            var reservationDate = formatToGMT8(reservation.reservationDate);

            // Create radio button
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "select-option";
            radio.classList.add("select-btn");
            radio.value = reservation._id; // Assign reservation ID

            // Create reservation detail icon
            const icon = document.createElement("img");
            icon.src = "img/reservation-details.jpeg";
            icon.dataset.reservationId = reservation._id;
            icon.addEventListener("click", function () { 
                openPopup2(this.dataset.reservationId);
            });  
            icon.setAttribute("data-reservationId", reservation._id);
            icon.classList.add("details");
            
    
            const row = document.createElement("tr");
            row.innerHTML = `
                <td style="text-align: right;"></td> <!-- Empty cell for radio button -->
                <td>${reservation.laboratoryRoom}</td>
                <td>${reservationDate}</td>
                <td><span id="start"> ${reservation.startTime} </span> - <span id="end"> ${reservation.endTime} </span></td>
                <td style="text-align: left;">
                    <!-- Empty cell for icon -->
                </td>
            `;

            // Append the radio button and reservation detail icon
            row.children[0].appendChild(radio);
            row.children[4].appendChild(icon);

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching reservations:", error);
    }
}