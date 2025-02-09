fetch('js/navbar-signedin.html')
.then(response => response.text())
.then(data => {
    let oldElement = document.querySelector("script#navigation");
    let newElement = document.createElement("navbar");
    newElement.innerHTML = data;
    oldElement.parentNode.replaceChild(newElement, oldElement);
})