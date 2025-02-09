/* adds outline design on active page in navigation bar */

    var includes = $('[data-include]');
    $.each(includes, function() {
        var file = 'views/' + $(this).data('include') + '.html';
        $(this).load(file, function() {
            var page = window.location.pathname.split("/").pop();

            /* TODO: add laboratories, reservation here */
            switch(page) {      
                case 'index.html':
                    document.getElementById("nav-home").classList.add("active");
                case 'signup-page.html':
                case 'signin-page.html':
                    document.getElementById("nav-header").classList.add("index-header")
                    break;
                case 'student-home.html':
                    document.getElementById("nav-home").classList.add("active");
                    break;
                default:
                    break;
            }
        });
    });