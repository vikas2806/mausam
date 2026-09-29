import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchLocations, EXPANDED_MOCK_LOCATIONS } from './geocodingProvider';

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
});
