import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProfile,
  saveProfile,
  hasCompletedOnboarding,
  setOnboardingCompleted,
  resetProfile,
  DEFAULT_PROFILE
} from './profileStorage';

describe('profileStorage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default profile when localStorage is empty', () => {
    const profile = getProfile();
    expect(profile).toEqual(DEFAULT_PROFILE);
    expect(hasCompletedOnboarding()).toBe(false);
  });

  it('saves and retrieves updated personas and location', () => {
    saveProfile({
      personas: ['beach', 'fitness', 'travel'],
      locationId: 'goa-01'
    });

    const updated = getProfile();
    expect(updated.personas).toEqual(['beach', 'fitness', 'travel']);
    expect(updated.locationId).toBe('goa-01');
  });

  it('updates onboarding completed flag', () => {
    expect(hasCompletedOnboarding()).toBe(false);
    setOnboardingCompleted(true);
    expect(hasCompletedOnboarding()).toBe(true);
  });

  it('resets profile clean state', () => {
    saveProfile({ personas: ['agri'], locationId: 'ludhiana-01' });
    setOnboardingCompleted(true);

    resetProfile();
    expect(getProfile()).toEqual(DEFAULT_PROFILE);
    expect(hasCompletedOnboarding()).toBe(false);
  });
});
