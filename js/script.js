/** Add any JavaScript you need to this file. */

"use strict";

import { names, descriptions } from "./names.js";

/*
 * filterState holds the state of all the current filters in effect as controlled from the sidebar.
 */

var filterState = {
    /* Breeds / breedNames should be parallel arrays */

    breeds: [],
    breedNames: [],
    other: {
        /*
         * Using numeric booleans to match types of Cat API booleans.
         */

        allergenic: 0,
        hairless: 0,
        indoor: 0,
        rare: 0
    }
};

/* Async functions that handle all XHR requests */

async function getFilteredContent() {
    let content = [];
    let breeds = [];

    if (filterState.breeds === undefined || filterState.breeds.length === 0) {
        /*
         * Breeds selector and the secondary selectors (allergenic, etc.) can
         * conflict - resolve these differences by either using breeds selected
         * in breed checkboxes (if any) or filter list of breeds based on traits.
         */

        breeds = Array.prototype.filter.call(await getCatBreeds(), breed => {
            return (
                breed.hypoallergenic === filterState.other.allergenic &&
                breed.hairless === filterState.other.hairless &&
                breed.indoor === filterState.other.indoor &&
                breed.rare === filterState.other.rare
            );
        });

        /*
         * Currently the getCatBreeds returns a huge list of breed objects with
         * multiple attributes - must boil this down to just simple array of ids.
         */

        breeds = Array.prototype.map.call(breeds, breed => breed.id);
    } else {
        breeds = filterState.breeds;
    }

    /*
     * If breeds are selected - send request and push for each breed.
     * Unfortunately Cat API doesn't support returning images of
     * multiple breeds with one request.
     */
    console.log(breeds);

    let i;
    for (i = 0; i < breeds.length; i++) {
        content.push(...(await getCatsByBreed(breeds[i])));
    }
    console.log(content);
    return content;
}

function getCatBreeds() {
    // Gets list of cat breeds for sidebar
    return makeCatRequest("https://api.thecatapi.com/v1/breeds");
}

function getCatsByBreed(breedId) {
    return makeCatRequest(
        "https://api.thecatapi.com/v1/images/search?size=thumbnail&limit=25&breed_ids=" +
            breedId
    );
}

function makeCatRequest(url) {
    return new Promise(function(resolve, reject) {
        let xhr = new XMLHttpRequest();

        /* Open new request and attach API Key.
         ** Got API Key by registering this project with Cat API.
         */

        xhr.open("GET", url);
        xhr.setRequestHeader("apiKey", "bfdbf747-0edd-49ac-9e38-a531be22c96a");

        xhr.onload = function() {
            if (this.status >= 200 && this.status < 300) {
                resolve(JSON.parse(this.responseText));
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };

        xhr.onerror = function() {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };

        xhr.send();
    });
}

/* Main functions that build actual store content from requests */

async function initSidebar(breeds) {
    let breedsDropDown = document.querySelector("#breedsDropDown");
    breeds.forEach(function(breed) {
        let div = document.createElement("div");
        div.setAttribute("class", "checkbox");

        let label = document.createElement("label");
        let list = document.createElement("input");
        list.setAttribute("type", "checkbox");
        list.setAttribute("class", "breed-option");
        list.setAttribute("value", "");

        /*
         * Attribute 'id' will be referenced later by click event handlers.
         * getAttribute('id') will be passed into query string to get cats
         * by that breed.
         */

        list.setAttribute("id", breed.id);
        list.setAttribute("name", breed.name);
        label.innerText = breed.name + " ";

        label.appendChild(list);
        div.appendChild(label);
        breedsDropDown.appendChild(div);
    });
}

function createCard(title, text, src) {
    /* Build Card */

    let row = document.createElement("div");
    row.setAttribute("class", "row");

    let col = document.createElement("div");
    col.setAttribute("class", "col-md");

    let card = document.createElement("div");
    card.setAttribute("class", "card");

    let img = document.createElement("img");
    img.setAttribute("class", "card-img-top");
    img.setAttribute("alt", "Cat Picture!");
    img.setAttribute("src", src);

    let body = document.createElement("div");
    body.setAttribute("class", "card-body");

    let cardTitle = document.createElement("h5");
    cardTitle.setAttribute("class", "card-title");

    let cardText = document.createElement("p");
    cardText.setAttribute("class", "card-text");

    /* Set Content */

    cardTitle.innerText = title;
    cardText.innerText = text;

    /* Append Children */

    body.appendChild(cardText);
    body.appendChild(cardTitle);

    card.appendChild(img);
    card.appendChild(body);

    col.appendChild(card);
    return col;
}

async function initContent(breeds) {
    /* Select random breed and display on initial load */

    let randomBreed = breeds[Math.floor(Math.random() * breeds.length)];
    let content = await getCatsByBreed(randomBreed.id);
    buildContent(content);
    console.log("Starting with: " + randomBreed.id);

    document.querySelector("#banner h1").innerText =
        "Showing Breed: " + randomBreed.name;

    return randomBreed;
}

function buildContent(content) {
    console.log(content);
    let storeContent = document.querySelector("#store-content");
    let row = document.createElement("div");
    row.setAttribute("class", "row");
    let i;
    for (i = 0; i < content.length; i++) {
        if (i % 3 === 0) {
            /* Every 3 iterations, append row and create new row */

            storeContent.appendChild(row);
            row = document.createElement("div");
            row.setAttribute("class", "row");
        }

        row.appendChild(
            createCard(
                descriptions[Math.floor(Math.random() * descriptions.length)],
                names[Math.floor(Math.random() * names.length)],
                content[i].url
            )
        );
    }
    if (content.length === 3 || content.length % 3 !== 0) {
        storeContent.appendChild(row);
    }
}

function setBanner() {
    let banner = document.querySelector("#banner h1");
    banner.innerText = "";

    if (filterState.breedNames.length === 0) {
        banner.innerText = "Please select a breed";
    } else if (filterState.breedNames.length === 1) {
        banner.innerText = "Showing Breed: " + filterState.breedNames[0];
    } else if (filterState.breedNames.length === 2) {
        banner.innerText =
            "Showing Breed: " +
            filterState.breedNames[0] +
            " and " +
            filterState.breedNames[1];
    } else if (filterState.breedNames.length === 3) {
        banner.innerText =
            "Showing Breed: " +
            filterState.breedNames[0] +
            ", " +
            filterState.breedNames[1] +
            " and " +
            filterState.breedNames[2];
    } else {
        banner.innerText =
            "Showing Breed: " +
            filterState.breedNames[0] +
            " and " +
            filterState.breedNames[1] +
            " and more";
    }
}

async function setupMenuHandlers() {
    document
        .querySelector("#breedsDropDown")
        .addEventListener("click", function(event) {
            if (event.target.checked === true) {
                filterState.breeds.push(event.target.getAttribute("id"));
                filterState.breedNames.push(event.target.getAttribute("name"));
            } else if (event.target.checked === false) {
                filterState.breeds.splice(
                    filterState.breeds.indexOf(event.target.getAttribute("id")),
                    1
                );
                filterState.breedNames.splice(
                    filterState.breeds.indexOf(
                        event.target.getAttribute("name")
                    ),
                    1
                );
            }
        });

    document
        .querySelector("#dropdown-button")
        .addEventListener("click", function() {
            let dropdown = document.querySelector("#breedsDropDown");
            if (dropdown.style.display === "none") {
                dropdown.style.display = "block";
            } else {
                dropdown.style.display = "none";
            }
        });

    document
        .querySelector("#other-options")
        .addEventListener("click", function(event) {
            if (event.target.checked === true) {
                filterState.other[event.target.id] = 1;
            } else if (event.target.checked === false) {
                filterState.other[event.target.id] = 0;
            }
        });

    document
        .querySelector("#clearFilter")
        .addEventListener("click", function() {
            document
                .querySelectorAll(".breed-option")
                .forEach(breed => (breed.checked = false));
            document.querySelector("#allergenic").checked = false;
            document.querySelector("#hairless").checked = false;
            document.querySelector("#indoor").checked = false;
            document.querySelector("#rare").checked = false;
            filterState.breeds = [];
            filterState.breedNames = [];
        });

    document
        .querySelector("#updateContent")
        .addEventListener("click", async function() {
            let storeContent = document.querySelector("#store-content");
            document.querySelector("#banner h1").innerText =
                "Loading Content...";
            storeContent.innerHTML = "";

            let content = await getFilteredContent();
            console.log(content);
            setBanner();
            buildContent(content);
        });

    window.onscroll = function() {
        let navbar = document.querySelector("#navbar");
        var sticky = navbar.offsetTop;

        if (window.pageYOffset > sticky) {
            navbar.setAttribute("class", "navbar navbar-static-top sticky");
        } else {
            navbar.removeAttribute("class");
            navbar.setAttribute("class", "navbar navbar-static-top");
        }
    };
}

/* Where it all starts */

window.onload = async function() {
    document.querySelector("#banner h1").innerText = "Loading Content...";
    let breeds = await getCatBreeds();
    await initSidebar(breeds);
    await initContent(breeds);
    setupMenuHandlers();
};
