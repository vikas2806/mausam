const PROFILE_KEY = 'mausam_user_profile';
const ONBOARDING_COMPLETED_KEY = 'mausam_onboarding_completed';

export const DEFAULT_LOCATION = {
  id: 'noida-01',
  name: 'Noida',
  state: 'Uttar Pradesh',
  country: 'IN',
  lat: 28.58,
  lon: 77.31,
  displayName: 'Sector 2, Noida'
};

export const DEFAULT_PROFILE = {
  personas: ['health', 'commute'],
  locationId: 'noida-01',
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
    return {
      personas: Array.isArray(parsed.personas) && parsed.personas.length > 0 ? parsed.personas : DEFAULT_PROFILE.personas,
      locationId: resolvedLocId,
      location: parsed.location || { ...DEFAULT_LOCATION, id: resolvedLocId },
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
    const locObj = profile.location || (profile.locationId ? { ...DEFAULT_LOCATION, id: profile.locationId } : current.location);
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
