// fetchOverpassData.js

async function fetchOverpassData(lat, lng, radius = 1000) {
    console.log("Fetching Overpass data for:", lat, lng);
    console.log("Querying Overpass API…");
    const query = `
        [out:json];
        (
          node["highway"="footway"](around:${radius}, ${lat}, ${lng});
          node["shop"="supermarket"](around:${radius}, ${lat}, ${lng});
          node["amenity"="restaurant"](around:${radius}, ${lat}, ${lng});
          node["leisure"="park"](around:${radius}, ${lat}, ${lng});
        );
        out body;
    `;

    const url = "https://overpass-api.de/api/interpreter";

    try {
        const res = await fetch(url, {
            method: "POST",
            body: query,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
        const data = await res.json();
        return data.elements; // an array of nodes
    } catch (error) {
        console.error("Overpass API error:", error);
        return [];
    }
}
