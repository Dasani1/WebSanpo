let map;
let activeCircle = null;
let rad = 1000;
let Colour = "#FF0000"; //Canadian Spelling only

let setRad, setRest, setMark, setPark; 
let latestCategories = null;
let latestLatLng = null;

let isEnabled = true; 

const categoryColors = {
    restaurant: "red",
    supermarket: "blue",
    park: "green"
};

function updateScoreAndCircle() { 
    if (!latestCategories || !latestLatLng) return; 

    const restVal = isNaN(parseFloat(setRest?.value)) ? 1 : parseFloat(setRest.value); 
    const markVal = isNaN(parseFloat(setMark?.value)) ? 1 : parseFloat(setMark.value); 
    const parkVal = isNaN(parseFloat(setMark?.value)) ? 1 : parseFloat(setPark.value);


    const score = (latestCategories.supermarket * markVal) + 
                  (latestCategories.restaurant * restVal) + 
                  (latestCategories.park * parkVal); 

    Colour = score >= 50 ? "#00FF00" : "#FF0000"; 

    if (activeCircle) activeCircle.setMap(null); 

    activeCircle = new google.maps.Circle({ 
        strokeColor: Colour, 
        strokeOpacity: 0.4, 
        strokeWeight: 1, 
        fillColor: Colour, 
        fillOpacity: 0.35, 
        map, 
        center: latestLatLng, 
        radius: rad 
    }); 

    document.getElementById("output").innerHTML = ` 
        <p>Found <strong>${Object.values(latestCategories).reduce((a, b) => a + b)}</strong> walkability-related locations:</p> 
        <ul style="list-style: none; padding: 0;"> 
            <li><span style="color: blue;">• Supermarkets (×${markVal}):</span> ${latestCategories.supermarket}</li> 
            <li><span style="color: red;">• Restaurants (×${restVal}):</span> ${latestCategories.restaurant}</li> 
            <li><span style="color: green;">• Parks (×${parkVal}):</span> ${latestCategories.park}</li>
        </ul> 
        <p><strong>→ Weighted Walkability Score:</strong> ${score.toFixed(2)}</p> 
    `; 
} 

function initMap() {
    // Assign slider variables after DOM is ready
    setRad = document.getElementById("radSize"); 
    setRest = document.getElementById("restprio"); 
    setMark = document.getElementById("supeprio"); 
    setPark = document.getElementById("parkprio");

    setRad.addEventListener("input", () => {
    rad = parseFloat(setRad.value);
    document.getElementById("radVal").innerText = rad; // ⬅️ live update
    updateScoreAndCircle(); // optional if you want circle to resize live
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

        latestCategories = categories; 
        latestLatLng = { lat, lng }; 
        updateScoreAndCircle(); 
    });


    setRest.addEventListener("input", updateScoreAndCircle); 
    setMark.addEventListener("input", updateScoreAndCircle); 
    setPark.addEventListener("input", updateScoreAndCircle);
}


window.initMap = initMap;
