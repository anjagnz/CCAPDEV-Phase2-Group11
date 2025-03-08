/* adds outline design on active page in navigation bar */

var includes = $('[data-include]');
$.each(includes, function() {
    var file = 'views/' + $(this).data('include') + '.html';
    $(this).load(file, function() {
        var page = window.location.pathname.split("/").pop() || "index.html"; 

        // Remove `.html` for consistency
        var pageWithoutExt = page.replace(".html", "");

        /* TODO: add laboratories, reservation here */
        switch(pageWithoutExt) {      
            case 'labtech-home':
                document.getElementById("nav-home")?.classList.add("active");
                break;
            case 'labtech-laboratories':
                document.getElementById("nav-lab")?.classList.add("active");
                break;
            case 'labtech-reservations':
                document.getElementById("nav-reserve")?.classList.add("active");
                break;
            default:
                break;
        }
    });
});