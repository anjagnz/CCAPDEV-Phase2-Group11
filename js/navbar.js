/* adds outline design on active page in navigation bar */

    var includes = $('[data-include]');
    $.each(includes, function() {
        var file = 'views/' + $(this).data('include') + '.html';
        $(this).load(file, function() {
            var page = window.location.pathname.split("/").pop();

            // add active class to the current page
            switch(page) {      
                case 'index.html':
                    document.getElementById("nav-home").classList.add("active");
                case 'signup-page.html':
                case 'signin-page.html':
                    // remove the header background color
                    document.getElementById("nav-header").classList.add("index-header")
                    break;
                case 'signedout-laboratories.html':
                    document.getElementById("nav-lab").classList.add("active");
                    break;
                case 'student-home.html':
                    document.getElementById("nav-home").classList.add("active");
                    break;
                case 'see-reservations.html':
                    document.getElementById("nav-reserve").classList.add("active");
                    break;
                case 'student-laboratories.html':
                    document.getElementById("nav-lab").classList.add("active");
                    break;
                default:
                    break;
            }
        });
    });
