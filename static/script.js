let map;
let activeCircle = null;
let rad = 1000;
let Colour = "#FF0000"; //Canadian Spelling only

let setRad, setRest, setMark, setPark; // new
let latestCategories = null;
let latestLatLng = null;

let isEnabled = true; //vibe

const categoryColors = {
    restaurant: "red",
    supermarket: "blue",
    park: "green"
};

function updateScoreAndCircle() { // new
    if (!latestCategories || !latestLatLng) return; // new

    const restVal = isNaN(parseFloat(setRest?.value)) ? 1 : parseFloat(setRest.value); // fixed
    const markVal = isNaN(parseFloat(setMark?.value)) ? 1 : parseFloat(setMark.value); // fixed
    const parkVal = isNaN(parseFloat(setMark?.value)) ? 1 : parseFloat(setPark.value);


    const score = (latestCategories.supermarket * markVal) + // new
                  (latestCategories.restaurant * restVal) + // new
                  (latestCategories.park * parkVal); // new

    Colour = score > 10 ? "#00FF00" : "#FF0000"; // new

    if (activeCircle) activeCircle.setMap(null); // new

    activeCircle = new google.maps.Circle({ // new
        strokeColor: Colour, // new
        strokeOpacity: 0.4, // new
        strokeWeight: 1, // new
        fillColor: Colour, // new
        fillOpacity: 0.35, // new
        map, // new
        center: latestLatLng, // new
        radius: rad // new
    }); // new

    document.getElementById("output").innerHTML = ` 
        <p>Found <strong>${Object.values(latestCategories).reduce((a, b) => a + b)}</strong> walkability-related locations:</p> 
        <ul style="list-style: none; padding: 0;"> 
            <li><span style="color: blue;">• Supermarkets (×${markVal}):</span> ${latestCategories.supermarket}</li> 
            <li><span style="color: red;">• Restaurants (×${restVal}):</span> ${latestCategories.restaurant}</li> 
            <li><span style="color: green;">• Parks (×${parkVal}):</span> ${latestCategories.park}</li>
        </ul> 
        <p><strong>→ Weighted Walkability Score:</strong> ${score.toFixed(2)}</p> 
    `; // new
} // new

function initMap() {
    // Assign slider variables after DOM is ready
    setRad = document.getElementById("radSize"); // new
    setRest = document.getElementById("restprio"); // new
    setMark = document.getElementById("supeprio"); // new
    setPark = document.getElementById("parkprio");

    setRad.addEventListener("input", ()=> {
        rad = parseFloat(setRad.value);
    });

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 43.6532, lng: -79.3832 }, // Downtown Toronto
        zoom: 13,
    });

    map.addListener("click", async (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        // Clear previous markers
        if (window.placeMarkers) {
            window.placeMarkers.forEach(marker => marker.setMap(null));
        }
        window.placeMarkers = [];

        // Remove previous circle
        if (activeCircle) {
            activeCircle.setMap(null);
        }

        // Save location to backend
        fetch('/save-location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lat, lng})
        });

        document.getElementById("output").innerText =
            `Fetching walkability data for: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        const results = await fetchOverpassData(lat, lng, rad);

        const categories = {
            supermarket: 0,
            restaurant: 0,
            park: 0
        };

        const seen = new Set();

        results.forEach(el => {
            const id = `${el.type}-${el.id}`;
            if (seen.has(id)) return;
            seen.add(id);

            const tags = el.tags || {};
            let category = null;

            if (tags.amenity === "restaurant") category = "restaurant";
            else if (tags.shop === "supermarket") category = "supermarket";
            else if (tags.leisure === "park") category = "park";

            if (category) {
                categories[category]++;

                const marker = new google.maps.Marker({
                    position: {
                        lat: el.lat || (el.center && el.center.lat),
                        lng: el.lon || (el.center && el.center.lon)
                    },
                    map: map,
                    title: tags.name || category,
                    icon: {
                        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                        scale: 4,
                        fillColor: categoryColors[category],
                        fillOpacity: 0.9,
                        strokeWeight: 1,
                        strokeColor: "#333"
                    }
                });

                window.placeMarkers.push(marker);
            }
        });

        latestCategories = categories; // new
        latestLatLng = { lat, lng }; // new
        updateScoreAndCircle(); // new
    });

    // Add live update listeners
    setRest.addEventListener("input", updateScoreAndCircle); // new
    setMark.addEventListener("input", updateScoreAndCircle); // new
    setPark.addEventListener("input", updateScoreAndCircle);
}

// Expose globally for Google Maps callback
window.initMap = initMap;
