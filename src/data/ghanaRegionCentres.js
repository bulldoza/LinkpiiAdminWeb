// Approximate coordinates of each region's capital, used only by the
// homepage "Near me" button to turn the phone's GPS position into a
// region name entirely on the device (no extra API call). It picks the
// nearest capital, so someone near a regional border can land in the
// neighbouring region - good enough to sort listings, not a geocoder.
// Region names match GHANA_REGIONS in ./ghanaLocations.js.

export const REGION_CENTRES = [
  { region: "Greater Accra", lat: 5.6037, lng: -0.187 },
  { region: "Ashanti", lat: 6.6885, lng: -1.6244 },
  { region: "Western", lat: 4.934, lng: -1.7137 },
  { region: "Central", lat: 5.1053, lng: -1.2466 },
  { region: "Eastern", lat: 6.094, lng: -0.2591 },
  { region: "Volta", lat: 6.6008, lng: 0.4713 },
  { region: "Northern", lat: 9.4008, lng: -0.8393 },
  { region: "Upper East", lat: 10.7856, lng: -0.8514 },
  { region: "Upper West", lat: 10.0601, lng: -2.5099 },
  { region: "Bono", lat: 7.3349, lng: -2.3123 },
  { region: "Bono East", lat: 7.5863, lng: -1.9381 },
  { region: "Ahafo", lat: 6.8036, lng: -2.5172 },
  { region: "Oti", lat: 8.0667, lng: 0.1833 },
  { region: "Savannah", lat: 9.0833, lng: -1.8167 },
  { region: "North East", lat: 10.5167, lng: -0.3667 },
  { region: "Western North", lat: 6.2057, lng: -2.485 },
];

const toRad = (deg) => (deg * Math.PI) / 180;

function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// Returns a region name, or null when the position is clearly outside
// Ghana (more than ~250 km from every regional capital).
export function nearestRegion(latitude, longitude) {
  if (latitude == null || longitude == null) return null;
  const here = { lat: latitude, lng: longitude };
  let best = null;
  for (const centre of REGION_CENTRES) {
    const d = distanceKm(here, centre);
    if (!best || d < best.d) best = { region: centre.region, d };
  }
  return best && best.d < 250 ? best.region : null;
}
