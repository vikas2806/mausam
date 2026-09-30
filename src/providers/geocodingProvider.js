import { getApiKey } from './openWeatherProvider';

export const EXPANDED_MOCK_LOCATIONS = [
  { id: 'noida-01', name: 'Noida', state: 'Uttar Pradesh', country: 'IN', lat: 28.58, lon: 77.31, isCoastal: false, isAgriRegion: false },
  { id: 'mumbai-01', name: 'Mumbai', state: 'Maharashtra', country: 'IN', lat: 18.94, lon: 72.82, isCoastal: true, isAgriRegion: false },
  { id: 'chennai-01', name: 'Chennai', state: 'Tamil Nadu', country: 'IN', lat: 13.05, lon: 80.28, isCoastal: true, isAgriRegion: false },
  { id: 'shimla-01', name: 'Shimla', state: 'Himachal Pradesh', country: 'IN', lat: 31.10, lon: 77.17, isCoastal: false, isAgriRegion: false },
  { id: 'goa-01', name: 'Calangute', state: 'Goa', country: 'IN', lat: 15.54, lon: 73.76, isCoastal: true, isAgriRegion: false },
  { id: 'ludhiana-01', name: 'Ludhiana', state: 'Punjab', country: 'IN', lat: 30.90, lon: 75.85, isCoastal: false, isAgriRegion: true },
  { id: 'bengaluru-01', name: 'Bengaluru', state: 'Karnataka', country: 'IN', lat: 12.97, lon: 77.59, isCoastal: false, isAgriRegion: false },
  { id: 'delhi-01', name: 'New Delhi', state: 'Delhi', country: 'IN', lat: 28.61, lon: 77.20, isCoastal: false, isAgriRegion: false },
  { id: 'kolkata-01', name: 'Kolkata', state: 'West Bengal', country: 'IN', lat: 22.57, lon: 88.36, isCoastal: true, isAgriRegion: false },
  { id: 'hyderabad-01', name: 'Hyderabad', state: 'Telangana', country: 'IN', lat: 17.38, lon: 78.48, isCoastal: false, isAgriRegion: false },
  { id: 'kochi-01', name: 'Kochi', state: 'Kerala', country: 'IN', lat: 9.93, lon: 76.26, isCoastal: true, isAgriRegion: false },
  { id: 'guwahati-01', name: 'Guwahati', state: 'Assam', country: 'IN', lat: 26.14, lon: 91.73, isCoastal: false, isAgriRegion: false },
  { id: 'jaipur-01', name: 'Jaipur', state: 'Rajasthan', country: 'IN', lat: 26.91, lon: 75.78, isCoastal: false, isAgriRegion: false },
  { id: 'srinagar-01', name: 'Srinagar', state: 'Jammu & Kashmir', country: 'IN', lat: 34.08, lon: 74.79, isCoastal: false, isAgriRegion: false },
  { id: 'ahmedabad-01', name: 'Ahmedabad', state: 'Gujarat', country: 'IN', lat: 23.02, lon: 72.57, isCoastal: false, isAgriRegion: false },
  { id: 'pune-01', name: 'Pune', state: 'Maharashtra', country: 'IN', lat: 18.52, lon: 73.85, isCoastal: false, isAgriRegion: false },
  { id: 'varanasi-01', name: 'Varanasi', state: 'Uttar Pradesh', country: 'IN', lat: 25.31, lon: 82.97, isCoastal: false, isAgriRegion: false },
  { id: 'bhubaneswar-01', name: 'Bhubaneswar', state: 'Odisha', country: 'IN', lat: 20.29, lon: 85.82, isCoastal: true, isAgriRegion: false }
];

export async function searchLocations(query, apiKey = getApiKey()) {
  const trimmed = (query || '').trim();
  if (!trimmed) return [];

  const useMock = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_MOCK_DATA === 'true') || !apiKey;

  if (useMock) {
    const qLower = trimmed.toLowerCase();
    return EXPANDED_MOCK_LOCATIONS.filter(l =>
      l.name.toLowerCase().includes(qLower) ||
      l.state.toLowerCase().includes(qLower) ||
      l.id.toLowerCase().includes(qLower)
    ).map(l => ({
      id: l.id,
      name: l.name,
      state: l.state,
      country: l.country,
      lat: l.lat,
      lon: l.lon,
      displayName: `${l.name}${l.state ? ', ' + l.state : ''}, ${l.country}`
    }));
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(trimmed)}&limit=5&appid=${apiKey}`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item, idx) => {
          const parts = [item.name, item.state, item.country].filter(Boolean);
          return {
            id: `owm-${item.lat.toFixed(4)}-${item.lon.toFixed(4)}-${idx}`,
            name: item.name,
            state: item.state || '',
            country: item.country || '',
            lat: item.lat,
            lon: item.lon,
            displayName: parts.join(', ')
          };
        });
      }
    }
  } catch (err) {
    console.warn(`[geocodingProvider] OWM geocode failed (${err.message}).`);
  }

  // Fallback to known locations list matching query
  const qLower = trimmed.toLowerCase();
  return EXPANDED_MOCK_LOCATIONS.filter(l =>
    l.name.toLowerCase().includes(qLower) ||
    l.state.toLowerCase().includes(qLower) ||
    l.id.toLowerCase().includes(qLower)
  ).map(l => ({
    id: l.id,
    name: l.name,
    state: l.state,
    country: l.country,
    lat: l.lat,
    lon: l.lon,
    displayName: `${l.name}${l.state ? ', ' + l.state : ''}, ${l.country}`
  }));
}

/**
 * Reverse geocode a lat/lon coordinate pair into a named location object.
 * Uses OpenWeatherMap's /geo/1.0/reverse endpoint, with a nearest-mock-city fallback.
 * @param {number} lat
 * @param {number} lon
 * @param {string} [apiKey]
 * @returns {Promise<{id: string, name: string, state: string, country: string, lat: number, lon: number, displayName: string}>}
 */
export async function reverseGeocode(lat, lon, apiKey = getApiKey()) {
  const useMock = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_MOCK_DATA === 'true') || !apiKey;

  if (!useMock) {
    try {
      // Request 3 candidates so we can pick the most specific (city-level) result.
      // OWM /geo/1.0/reverse with limit=1 can return broad administrative zones
      // (e.g. "Konkan Division") for coordinates outside recognised city boundaries.
      const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=3&appid=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Reverse geocode API error ${res.status}`);
      const data = await res.json();
      if (data && data.length > 0) {
        // Prefer a result whose name differs from its state — administrative division
        // names often equal the region name (e.g. name="Konkan Division",
        // state="Maharashtra"), whereas city-level results do not.
        const cityLevel = data.find(item => item.name && item.state && item.name !== item.state);
        const item = cityLevel || data[0];
        // Prefer the English local name when available (OWM provides it under local_names.en)
        const resolvedName = item.local_names?.en || item.name;
        return {
          id: `rev-${lat.toFixed(4)}-${lon.toFixed(4)}`,
          name: resolvedName,
          state: item.state || '',
          country: item.country || '',
          lat,
          lon,
          displayName: `${resolvedName}${item.state ? ', ' + item.state : ''}${item.country ? ', ' + item.country : ''}`,
        };
      }
    } catch (err) {
      console.warn(`[geocodingProvider] Reverse geocode failed (${err.message}). Falling back to nearest mock.`);
    }
  }

  // Fallback: find nearest city in mock list by straight-line distance.
  // Only substitute if the nearest mock city is within ~0.9 degrees (~100 km).
  // Beyond that threshold, return an honest coordinate-based name rather than
  // silently showing a city that could be 300-400 km away.
  const NEARBY_THRESHOLD_DEG = 0.9; // ≈ 100 km
  let nearest = null;
  let minDist = Infinity;
  for (const loc of EXPANDED_MOCK_LOCATIONS) {
    const dist = Math.sqrt((loc.lat - lat) ** 2 + (loc.lon - lon) ** 2);
    if (dist < minDist) { minDist = dist; nearest = loc; }
  }

  if (nearest && minDist <= NEARBY_THRESHOLD_DEG) {
    return {
      id: nearest.id,
      name: nearest.name,
      state: nearest.state,
      country: nearest.country,
      lat: nearest.lat,
      lon: nearest.lon,
      displayName: `${nearest.name}${nearest.state ? ', ' + nearest.state : ''}, ${nearest.country}`,
    };
  }

  // No nearby mock city — return an honest coordinate-based location.
  // The user can then manually search for a nearby city.
  const coordId = `coord-${lat.toFixed(4)}-${lon.toFixed(4)}`;
  const coordName = `Location (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`;
  return {
    id: coordId,
    name: coordName,
    state: '',
    country: '',
    lat,
    lon,
    displayName: coordName,
  };
}
