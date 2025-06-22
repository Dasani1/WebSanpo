// fetchOverpassData.js

async function fetchOverpassData(lat, lng, radius = 1000) {
    console.log("Fetching Overpass data for:", lat, lng);
    console.log("Querying Overpass API…");
    const query = `
    [out:json];
    (
    // More reliable footways
    way["highway"="footway"](around:1000, ${lat}, ${lng});
    way["highway"="path"]["foot"="yes"](around:1000, ${lat}, ${lng});
    
    // Supermarkets (usually reliable)
    node["shop"="supermarket"](around:1000, ${lat}, ${lng});

    // Restaurants — only those with at least one name tag
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
