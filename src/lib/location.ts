import { HospitalFacility } from "../types";

// Haversine formula to calculate distance in miles
export function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export async function fetchNearbyFacilities(lat: number, lon: number): Promise<HospitalFacility[]> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:8000, ${lat}, ${lon});
      node["amenity"="clinic"](around:8000, ${lat}, ${lon});
      node["amenity"="pharmacy"](around:8000, ${lat}, ${lon});
      node["amenity"="doctors"](around:8000, ${lat}, ${lon});
    );
    out body;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Overpass API returned status ${response.status}`);
    }
    const data = await response.json();
    if (!data.elements) return [];

    const facilities: HospitalFacility[] = data.elements.map((el: any) => {
      let type = "Facility";
      if (el.tags?.amenity === "hospital") type = "Hospital";
      else if (el.tags?.amenity === "clinic") type = "Clinic";
      else if (el.tags?.amenity === "pharmacy") type = "Pharmacy";
      else if (el.tags?.amenity === "doctors") type = "Medical Clinic / Specialist";

      // Some tags have addresses
      const street = el.tags?.["addr:street"] || "";
      const house = el.tags?.["addr:housenumber"] || "";
      const city = el.tags?.["addr:city"] || "";
      const address = [house, street, city].filter(Boolean).join(" ") || "Address not specified";

      const distance = getDistanceMiles(lat, lon, el.lat, el.lon);

      return {
        name: el.tags?.name || `${type} (Unnamed)`,
        type,
        lat: el.lat,
        lon: el.lon,
        distance,
        address,
      };
    });

    // Sort by distance
    return facilities.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  } catch (err) {
    console.error("Error fetching Overpass data, falling back to local simulation:", err);
    throw err;
  }
}
