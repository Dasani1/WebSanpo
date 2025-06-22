// fetchOverpassData.js

async function fetchOverpassData(lat, lng, radius) {
    console.log("Fetching Overpass data for:", lat, lng);
    console.log("Querying Overpass API…");
    const query = `
    [out:json];
    (
    // Supermarkets (usually reliable)
    node["shop"="supermarket"](around:1000, ${lat}, ${lng});

    // Restaurants (at least one tag)
    node["amenity"="restaurant"]["name"](around:1000, ${lat}, ${lng});

    // Parks — include ways + nodes
    node["leisure"="park"](around:1000, ${lat}, ${lng});
    way["leisure"="park"](around:1000, ${lat}, ${lng});
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
