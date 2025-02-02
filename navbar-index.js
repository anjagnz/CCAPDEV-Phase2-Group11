fetch('navbar-index.html')
.then(response => response.text())
.then(data => {
    let oldElement = document.querySelector("script#nav-placeholder");
    let newElement = document.createElement("navbar");
    newElement.innerHTML = data;
    oldElement.parentNode.replaceChild(newElement, oldElement);
})