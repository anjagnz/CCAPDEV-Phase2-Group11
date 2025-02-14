/* adds outline design on active page in navigation bar */

    var includes = $('[data-include]');
    $.each(includes, function() {
        var file = 'views/' + $(this).data('include') + '.html';
        $(this).load(file, function() {
            var page = window.location.pathname.split("/").pop();

            /* TODO: add laboratories, reservation here */
            switch(page) {      
                case 'labtech-home.html':
                    document.getElementById("nav-home").classList.add("active");
                    break;
                case 'labtech-laboratories.html':
                    document.getElementById("nav-lab").classList.add("active");
                    break;
                case 'labtech-reservations.html':
                    document.getElementById("nav-reserve").classList.add("active");
                default:
                    break;
            }
        });
    });
