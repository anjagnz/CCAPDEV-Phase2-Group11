/* adds outline design on active page in navigation bar */

var includes = $('[data-include]');
$.each(includes, function() {
    var file = 'partials/' + $(this).data('include') + '.html';
    $(this).load(file, function() {
        var page = window.location.pathname.split("/").pop() || "index.html"; 

        var pageWithoutExt = page.replace(".html", "");

        // add active class to the current page
        switch(pageWithoutExt) {      
            case 'index':
                document.getElementById("nav-home")?.classList.add("active");
                break;
            case 'signup-page':
            case 'signin-page':
                // remove the header background color
                document.getElementById("nav-header")?.classList.add("index-header");
                break;
            case 'signedout-lab':
            case 'signedout-laboratories':
                document.getElementById("nav-lab")?.classList.add("active");
                break;
            case 'student-home':
                document.getElementById("nav-home")?.classList.add("active");
                break;
            case 'see-reservations':
                document.getElementById("nav-reserve")?.classList.add("active");
                break;
            case 'student-laboratories':
                document.getElementById("nav-lab")?.classList.add("active");
                break;
            default:
                break;
        }
    });
});