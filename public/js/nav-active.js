/* adds outline design on active page in navigation bar */
$(document).ready(function() {
    // handle dynamic profile image display on navigation bar
    const userId = localStorage.getItem('userId');
    
    if (userId) {
        fetch(`/api/user/details/${userId}`)
            .then(response => response.json())
            .then(userData => {
                if (userData.image) {
                    // update the profile image src
                    const profileImg = document.getElementById('profile-img');
                    if (profileImg) {
                        profileImg.src = userData.image;
                    }
                }
            })
            .catch(error => console.error('Error fetching user data:', error));
    }

    var page = window.location.pathname.split("/").pop() || "index.html"; 
    var pageWithoutExt = page.replace(".html", "");

    // add active class to the current page
    switch(pageWithoutExt) {      
        case 'index':
            $('#nav-home').addClass('active');
            break;
        case 'labtech-home':
            $('#nav-home').addClass('active');
            break;
        case 'labtech-laboratories':
            $('#nav-lab').addClass('active');
            break;
        case 'labtech-reservations':
            $('#nav-reserve').addClass('active');
            break;
    }
});
