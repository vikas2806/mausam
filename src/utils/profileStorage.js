const PROFILE_KEY = 'mausam_user_profile';
const ONBOARDING_COMPLETED_KEY = 'mausam_onboarding_completed';

export const KNOWN_LOCATIONS = [
  { id: 'mumbai-01', name: 'Mumbai', state: 'Maharashtra', country: 'IN', lat: 19.0760, lon: 72.8777, displayName: 'Mumbai, Maharashtra, IN', isCoastal: true, isAgriRegion: false },
  { id: 'noida-01', name: 'Noida', state: 'Uttar Pradesh', country: 'IN', lat: 28.58, lon: 77.31, displayName: 'Sector 2, Noida', isCoastal: false, isAgriRegion: false },
  { id: 'chennai-01', name: 'Chennai', state: 'Tamil Nadu', country: 'IN', lat: 13.05, lon: 80.28, displayName: 'Marina Beach, Chennai', isCoastal: true, isAgriRegion: false },
  { id: 'shimla-01', name: 'Shimla', state: 'Himachal Pradesh', country: 'IN', lat: 31.10, lon: 77.17, displayName: 'Mall Road, Shimla', isCoastal: false, isAgriRegion: false },
  { id: 'goa-01', name: 'Calangute', state: 'Goa', country: 'IN', lat: 15.54, lon: 73.76, displayName: 'Calangute, Goa', isCoastal: true, isAgriRegion: false },
  { id: 'ludhiana-01', name: 'Ludhiana', state: 'Punjab', country: 'IN', lat: 30.90, lon: 75.85, displayName: 'Ludhiana Agricultural District, Punjab', isCoastal: false, isAgriRegion: true },
  { id: 'delhi-01', name: 'New Delhi', state: 'Delhi', country: 'IN', lat: 28.61, lon: 77.20, displayName: 'New Delhi, Delhi, IN', isCoastal: false, isAgriRegion: false },
  { id: 'bengaluru-01', name: 'Bengaluru', state: 'Karnataka', country: 'IN', lat: 12.97, lon: 77.59, displayName: 'Bengaluru, Karnataka, IN', isCoastal: false, isAgriRegion: false },
  { id: 'kolkata-01', name: 'Kolkata', state: 'West Bengal', country: 'IN', lat: 22.57, lon: 88.36, displayName: 'Kolkata, West Bengal, IN', isCoastal: true, isAgriRegion: false },
  { id: 'hyderabad-01', name: 'Hyderabad', state: 'Telangana', country: 'IN', lat: 17.38, lon: 78.48, displayName: 'Hyderabad, Telangana, IN', isCoastal: false, isAgriRegion: false },
  { id: 'kochi-01', name: 'Kochi', state: 'Kerala', country: 'IN', lat: 9.93, lon: 76.26, displayName: 'Kochi, Kerala, IN', isCoastal: true, isAgriRegion: false }
];

export function findLocationById(id) {
  if (!id) return null;
  return KNOWN_LOCATIONS.find(l => l.id === id) || null;
}

export const DEFAULT_LOCATION = KNOWN_LOCATIONS[0]; // Default to Mumbai

export const DEFAULT_PROFILE = {
  personas: ['health', 'commute'],
  locationId: 'mumbai-01',
  location: DEFAULT_LOCATION,
  healthInputs: {
    respiratorySensitivity: false,
    outdoorRunner: false,
    dailyCommuter: true
  }
};

/**
 * Retrieve active user profile from local storage.
 */
export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    const resolvedLocId = parsed.locationId || parsed.location?.id || DEFAULT_PROFILE.locationId;
    const resolvedLoc = parsed.location || findLocationById(resolvedLocId) || { ...DEFAULT_LOCATION, id: resolvedLocId };
    return {
      personas: Array.isArray(parsed.personas) && parsed.personas.length > 0 ? parsed.personas : DEFAULT_PROFILE.personas,
      locationId: resolvedLocId,
      location: resolvedLoc,
      healthInputs: { ...DEFAULT_PROFILE.healthInputs, ...(parsed.healthInputs || {}) }
    };
  } catch (err) {
    console.error('Failed to parse user profile from localStorage:', err);
    return DEFAULT_PROFILE;
  }
}

/**
 * Save user profile to local storage.
 */
export function saveProfile(profile) {
  try {
    const current = getProfile();
    const locId = profile.locationId || profile.location?.id || current.locationId;
    let locObj = profile.location;
    if (!locObj) {
      if (profile.locationId && profile.locationId !== current.locationId) {
        locObj = findLocationById(profile.locationId) || { ...DEFAULT_LOCATION, id: profile.locationId };
      } else {
        locObj = current.location || DEFAULT_LOCATION;
      }
    }
    const updated = {
      ...current,
      ...profile,
      locationId: locId,
      location: locObj,
      healthInputs: { ...current.healthInputs, ...(profile.healthInputs || {}) }
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save user profile to localStorage:', err);
    return DEFAULT_PROFILE;
  }
}

/**
 * Check if user completed onboarding.
 */
export function hasCompletedOnboarding() {
  return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
}

/**
 * Set onboarding completion state.
 */
export function setOnboardingCompleted(completed = true) {
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, completed ? 'true' : 'false');
}

/**
 * Reset profile back to defaults.
 */
export function resetProfile() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  return DEFAULT_PROFILE;
}

// ── Custom Personas ────────────────────────────────────────────────────────────

const CUSTOM_PERSONAS_KEY = 'mausam_custom_personas';

/**
 * Retrieve all user-created custom persona objects.
 * @returns {object[]}
 */
export function getCustomPersonas() {
  try {
    const raw = localStorage.getItem(CUSTOM_PERSONAS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save a new custom persona object. Overwrites if same id exists.
 * @param {object} persona  Full persona definition matching personas.json schema.
 */
export function saveCustomPersona(persona) {
  try {
    const existing = getCustomPersonas().filter(p => p.id !== persona.id);
    const updated = [...existing, persona];
    localStorage.setItem(CUSTOM_PERSONAS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save custom persona:', err);
    return getCustomPersonas();
  }
}

/**
 * Delete a custom persona by id.
 * @param {string} personaId
 */
export function deleteCustomPersona(personaId) {
  try {
    const updated = getCustomPersonas().filter(p => p.id !== personaId);
    localStorage.setItem(CUSTOM_PERSONAS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return getCustomPersonas();
  }
}
