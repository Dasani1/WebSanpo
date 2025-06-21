let map;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 43.65107, lng: -79.347015 },
        zoom: 8,
    });

    map.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        fetch('/save-location', {   
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lat: lat, lng: lng })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById("output").textContent =
                `Saved location: (${data.lat.toFixed(5)}, ${data.lng.toFixed(5)})`;
        });
    });
}

window.initMap = initMap;
