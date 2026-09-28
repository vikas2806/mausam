const PROFILE_KEY = 'mausam_user_profile';
const ONBOARDING_COMPLETED_KEY = 'mausam_onboarding_completed';

export const DEFAULT_PROFILE = {
  personas: ['health', 'commute'],
  locationId: 'noida-01',
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
    return {
      personas: Array.isArray(parsed.personas) && parsed.personas.length > 0 ? parsed.personas : DEFAULT_PROFILE.personas,
      locationId: parsed.locationId || DEFAULT_PROFILE.locationId,
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
    const updated = {
      ...current,
      ...profile,
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
