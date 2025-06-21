let map;
let activeCircle = null;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 43.6532, lng: -79.3832 }, //Downtown Toronto
        zoom: 13,
    });

    map.addListener("click", async (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();



        if (activeCircle){
            activeCircle.setMap(null);
        }


        activeCircle = new google.maps.Circle({
            strokeColor: "#FF0000",
            strokeOpacity: 0.4,
            strokeWeight:1,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map,
            center: {lat,lng},
            radius: 1000, //1km
        });

        // Save to backend
        fetch('/save-location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lat: lat, lng: lng })
        });

        // Display fetching text
        document.getElementById("output").innerText = `Fetching walkability data for: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        // Call Overpass
        const results = await fetchOverpassData(lat, lng);

        const categories = {
            footway: 0,
            supermarket: 0,
            restaurant: 0,
            park: 0
        };

        results.forEach(el => {
            const tags = el.tags || {};
            if (tags.highway === "footway") categories.footway++;
            if (tags.shop === "supermarket") categories.supermarket++;
            if (tags.amenity === "restaurant") categories.restaurant++;
            if (tags.leisure === "park") categories.park++;
        });

        const score = categories.footway + categories.supermarket + categories.restaurant + categories.park;

        document.getElementById("output").innerText = `
Found ${results.length} walkability-related locations:
- Footpaths: ${categories.footway}
- Supermarkets: ${categories.supermarket}
- Restaurants: ${categories.restaurant}
- Parks: ${categories.park}
→ Walkability Score: ${score}
        `;
    });
}

// Expose globally for Google Maps callback
window.initMap = initMap;
