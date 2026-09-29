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

  it('persists selected persona (e.g. default or beach) so onboarding is not re-asked on app open', () => {
    // 1. Simulate user selecting 'default' persona during onboarding
    saveProfile({ personas: ['default'], locationId: 'mumbai-01' });
    setOnboardingCompleted(true);

    // 2. Simulate subsequent app reload — getProfile() and hasCompletedOnboarding() read from storage
    const loadedProfile = getProfile();
    const isCompleted = hasCompletedOnboarding();

    expect(isCompleted).toBe(true);
    expect(loadedProfile.personas).toEqual(['default']);
    expect(loadedProfile.locationId).toBe('mumbai-01');
  });
});
