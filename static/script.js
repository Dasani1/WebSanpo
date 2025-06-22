let map;
let activeCircle = null;
let rad = 1000;

const categoryColors = {
    restaurant: "red",
    supermarket: "blue",
    park: "green"
};

function initMap() {
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

        // Draw a red circle around the clicked location
        activeCircle = new google.maps.Circle({
            strokeColor: "#FF0000",
            strokeOpacity: 0.4,
            strokeWeight: 1,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map,
            center: { lat, lng },
            radius: 1000, // 1 km radius
        });

        // Save location to backend
        fetch('/save-location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lat, lng })
        });

        // Update UI
        document.getElementById("output").innerText =
            `Fetching walkability data for: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        // Fetch OSM data
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

        const score =  categories.supermarket + categories.restaurant + categories.park;

        document.getElementById("output").innerHTML = `
        <p>Found <strong>${results.length}</strong> walkability-related locations:</p>
        <ul style="list-style: none; padding: 0;">
            <li><span style="color: blue;">• Supermarkets:</span> ${categories.supermarket}</li>
            <li><span style="color: red;">• Restaurants:</span> ${categories.restaurant}</li>
            <li>Parks: ${categories.park}</li>
        </ul>
        <p><strong>→ Walkability Score:</strong> ${score}</p>
    `;
    });
}
// Expose globally for Google Maps callback
window.initMap = initMap;

