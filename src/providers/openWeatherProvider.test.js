import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenWeatherProvider } from './openWeatherProvider';

describe('OpenWeatherProvider', () => {
  let provider;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
    provider = new OpenWeatherProvider('test-api-key');
  });

  it('falls back to MockWeatherProvider when API key is missing', async () => {
    const noKeyProvider = new OpenWeatherProvider('');
    const data = await noKeyProvider.getWeatherData('noida-01');
    expect(data).toBeDefined();
    expect(data.location.name).toBeDefined();
  });

  it('fetches and normalizes weather data correctly from mock fetch', async () => {
    const mockWeather = {
      name: 'Noida',
      main: { temp: 28, feels_like: 29, temp_min: 22, temp_max: 33, humidity: 60, pressure: 1012 },
      wind: { speed: 4.5 },
      weather: [{ main: 'Clear', description: 'clear sky' }],
      sys: { sunrise: 1600000000, sunset: 1600040000 },
      visibility: 8000
    };

    const mockForecast = {
      list: [
        { dt: 1600000000, main: { temp: 28, humidity: 60 }, pop: 0.2, weather: [{ main: 'Clear' }] },
        { dt: 1600010800, main: { temp: 26, humidity: 65 }, pop: 0.1, weather: [{ main: 'Clouds' }] }
      ]
    };

    const mockPollution = {
      list: [
        { main: { aqi: 3 }, components: { pm2_5: 35, pm10: 70 } }
      ]
    };

    global.fetch = vi.fn((url) => {
      if (url.includes('/weather')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockWeather) });
      }
      if (url.includes('/forecast')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockForecast) });
      }
      if (url.includes('/air_pollution')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPollution) });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const data = await provider.getWeatherData('noida-01');

    expect(data.current.temperature).toBe(28);
    expect(data.current.feelsLike).toBe(29);
    expect(data.current.humidity).toBe(60);
    expect(data.airQuality.aqi).toBe(125); // mapped from OWM index 3
    expect(data.airQuality.category).toBe('Moderate');
    expect(data.hourly.length).toBeGreaterThan(0);
  });

  it('falls back to MockWeatherProvider on HTTP network failure', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 401 }));

    const data = await provider.getWeatherData('noida-01');
    expect(data).toBeDefined();
    expect(data.location).toBeDefined();
  });

  it('serves unexpired data from cache without re-fetching network APIs', async () => {
    const mockWeather = {
      name: 'Noida',
      main: { temp: 30, humidity: 50 },
      weather: [{ main: 'Clear' }]
    };
    const fetchSpy = vi.fn((url) => {
      if (url.includes('/weather')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockWeather) });
      if (url.includes('/forecast')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ list: [] }) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ list: [] }) });
    });
    global.fetch = fetchSpy;

    // First call triggers network fetch
    const data1 = await provider.getWeatherData('mumbai-01');
    const firstCallCount = fetchSpy.mock.calls.length;

    // Second call for same location within TTL returns cached result without additional fetch calls
    const data2 = await provider.getWeatherData('mumbai-01');
    expect(fetchSpy.mock.calls.length).toBe(firstCallCount);
    expect(data2.current.temperature).toBe(data1.current.temperature);
  });

  it('correctly parses real sunrise and sunset times with non-12h day length and timezone offset', async () => {
    // Summer solstice date: UTC midnight is 1718928000 (2024-06-21 00:00:00 UTC)
    // Desired local time in IST (+05:30 = +19800s):
    // Sunrise 06:02 AM -> 1718928000 + (6 * 3600 + 2 * 60) - 19800
    // Sunset 07:18 PM (19:18) -> 1718928000 + (19 * 3600 + 18 * 60) - 19800
    // Day length: 13h16m (NOT 12h00m)
    const baseMidnightUtc = 1718928000;
    const tzOffset = 19800;
    const mockWeather = {
      name: 'Mumbai',
      timezone: tzOffset,
      main: { temp: 31, humidity: 75 },
      weather: [{ main: 'Clear' }],
      sys: {
        sunrise: baseMidnightUtc + (6 * 3600 + 2 * 60) - tzOffset,
        sunset: baseMidnightUtc + (19 * 3600 + 18 * 60) - tzOffset
      }
    };

    global.fetch = vi.fn((url) => {
      if (url.includes('/weather')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockWeather) });
      if (url.includes('/forecast')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ list: [] }) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ list: [] }) });
    });

    const data = await provider.getWeatherData('mumbai-01');
    expect(data.current.sunrise).toBe('06:02 AM');
    expect(data.current.sunset).toBe('07:18 PM');
    // Verify it is not a 12h offset (06:02 AM + 12h = 06:02 PM != 07:18 PM)
    expect(data.current.sunset).not.toBe('06:02 PM');
  });
});

