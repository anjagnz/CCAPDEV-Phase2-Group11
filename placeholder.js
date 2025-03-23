function generateValidEndTimes(selectedSeat) {
    const seatNumber = selectedSeat.getAttribute("seat-number");
    const seatTime = selectedSeat.getAttribute("seat-time");

    const selectedLab = document.getElementById("labs").value;
    const selectedDate = document.getElementById("dates").value;

    const timeSlots = [
         "07:30 A.M.", "08:00 A.M.", "08:30 A.M.", "09:00 A.M.",
        "09:30 A.M.", "10:00 A.M.", "10:30 A.M.", "11:00 A.M.",
        "11:30 A.M.", "12:00 P.M.", "12:30 P.M.", "01:00 P.M.",
        "01:30 P.M.", "02:00 P.M.", "02:30 P.M.", "03:00 P.M.",
        "03:30 P.M.", "04:00 P.M.", "04:30 P.M.", "05:00 P.M.",
        "05:30 P.M.", "06:00 P.M.", "06:30 P.M.", "07:00 P.M.",
        "07:30 P.M.", "08:00 P.M.", "08:30 P.M.", "09:00 P.M."
    ];

    const startIndex = timeSlots.indexOf(seatTime);
    
    if(startIndex === -1) {
        console.error("Invalid start time: ", seatTime);
        return;
    }

    const endTimesDropdown = document.getElementById("endtimes");
    endTimesDropdown.innerHTML = `<option value="" disabled selected>Select an End Time</option>`;

    // Fetch current reservations from the server
    fetch(`/api/reservations/lab/${selectedLab}/date/${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            let nextReservationIndex = timeSlots.length;
            
            if (data.reservations && data.reservations.length > 0) {
                
                const seatReservations = data.reservations.filter(res =>
                    res.seatNumber.toString() === seatNumber.toString() &&
                    timeSlots.indexOf(res.startTime) > startIndex
                );

                if(seatReservations.length > 0) {
                    const earliestNextReservation = seatReservations.reduce((earliest, current) => {
                        const earliestIndex = timeSlots.indexOf(earliest.startTime);
                        const currentIndex = timeSlots.indexOf(current.startTime);
                        return (currentIndex < earliestIndex) ? current : earliest;
                    });

                nextReservationIndex = timeSlots.indexOf(earliestNextReservation.startTime);
                }
            }

            for(let i = startIndex + 1; i <= nextReservationIndex; i++) {
                if(i < timeSlots.length) {
                    const option = document.createElement("option");
                    option.value = timeSlots[i];
                    option.text = timeSlots[i];
                    endTimesDropdown.appendChild(option);
                }
            }

            if(endTimesDropdown.options.length === 1) {
                const option = document.createElement("option");
                option.value = "";
                option.text = "No available end times";
                option.disabled = true;
                endTimesDropdown.appendChild(option);
            }
        })
        .catch(error => {
            console.error('Error fetching reservations:', error);
    });
}

document.getElementById("endtimes").addEventListener("change", function() {

    const timeSlots = [
        "07:30 A.M.", "08:00 A.M.", "08:30 A.M.", "09:00 A.M.",
        "09:30 A.M.", "10:00 A.M.", "10:30 A.M.", "11:00 A.M.",
        "11:30 A.M.", "12:00 P.M.", "12:30 P.M.", "01:00 P.M.",
        "01:30 P.M.", "02:00 P.M.", "02:30 P.M.", "03:00 P.M.",
        "03:30 P.M.", "04:00 P.M.", "04:30 P.M.", "05:00 P.M.",
        "05:30 P.M.", "06:00 P.M.", "06:30 P.M.", "07:00 P.M.",
        "07:30 P.M.", "08:00 P.M.", "08:30 P.M.", "09:00 P.M."
    ];

    const selectedEndTime = this.value;
    const selectedSeat = document.querySelector(".selected-seat");
    const selectedStartTime = selectedSeat.getAttribute("seat-time");

    const startIndex = timeSlots.indexOf(selectedStartTime);
    const endIndex = timeSlots.indexOf(selectedEndTime);

    if(startIndex === -1 || endIndex === -1) {
        console.error("Invalid time range.");
        return;
    }

    document.querySelectorAll(`[seat-number="${selectedSeat.getAttribute("seat-number")}"]`).forEach(seat => {
        const seatTime = seat.getAttribute("seat-time");
        const seatIndex = timeSlots.indexOf(seatTime);

        if(seatIndex >= startIndex && seatIndex < endIndex)
        {
            seat.classList.add("selected-seat");
        } else {
            seat.classList.remove("selected-seat");
        }
    })
})