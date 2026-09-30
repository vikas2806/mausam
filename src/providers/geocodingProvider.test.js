import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchLocations, reverseGeocode, EXPANDED_MOCK_LOCATIONS } from './geocodingProvider';

describe('geocodingProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when query is empty or whitespace', async () => {
    const results = await searchLocations('   ', 'fake-key');
    expect(results).toEqual([]);
  });

  it('searches expanded mock list when API key is missing or mock mode active', async () => {
    const results = await searchLocations('Kochi', '');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Kochi');
    expect(results[0].displayName).toContain('Kochi');
    expect(results[0].lat).toBeCloseTo(9.93);
  });

  it('fetches direct geocoding data from OpenWeatherMap API when key is present', async () => {
    const mockApiResponse = [
      { name: 'Kochi', state: 'Kerala', country: 'IN', lat: 9.9312, lon: 76.2673 }
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })
    );

    const results = await searchLocations('Kochi', 'valid-test-key');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.openweathermap.org/geo/1.0/direct?q=Kochi')
    );
    expect(results.length).toBe(1);
    expect(results[0].displayName).toBe('Kochi, Kerala, IN');
    expect(results[0].lat).toBe(9.9312);
  });

  it('falls back to expanded mock locations on HTTP error', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 500 }));

    const results = await searchLocations('Guwahati', 'valid-test-key');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Guwahati');
  });

  // ── reverseGeocode tests ───────────────────────────────────────────────────

  it('reverseGeocode: prefers city-level name over administrative division name', async () => {
    // First result is an admin zone (name === state), second is a proper city
    const mockData = [
      { name: 'Konkan Division', state: 'Konkan Division', country: 'IN' },
      { name: 'Ratnagiri', state: 'Maharashtra', country: 'IN' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockData) })
    );

    const result = await reverseGeocode(16.99, 73.30, 'valid-test-key');
    expect(result.name).toBe('Ratnagiri');
    expect(result.displayName).toContain('Ratnagiri');
  });

  it('reverseGeocode: uses local_names.en when available', async () => {
    const mockData = [
      {
        name: 'Mumbā',
        local_names: { en: 'Mumbai' },
        state: 'Maharashtra',
        country: 'IN',
      },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockData) })
    );

    const result = await reverseGeocode(18.94, 72.82, 'valid-test-key');
    expect(result.name).toBe('Mumbai');
  });

  it('reverseGeocode: requests limit=3 from the API', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([{ name: 'TestCity', state: 'State', country: 'IN' }]) })
    );
    await reverseGeocode(28.58, 77.31, 'valid-test-key');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('limit=3'));
  });

  it('reverseGeocode: uses nearest mock city when within ~100km (no API key)', async () => {
    // Noida mock is at 28.58, 77.31 — passing exact same coords should match it
    const result = await reverseGeocode(28.58, 77.31, '');
    expect(result.name).toBe('Noida');
  });

  it('reverseGeocode: returns coordinate-based name when no mock city is within ~100km', async () => {
    // Middle of the Indian Ocean — far from every mock city
    const result = await reverseGeocode(10.00, 65.00, '');
    expect(result.name).toMatch(/Location/);
    expect(result.name).toContain('°N');
    // Must NOT silently return a named Indian city
    expect(['Mumbai', 'Noida', 'Chennai', 'Kochi']).not.toContain(result.name);
  });
});

