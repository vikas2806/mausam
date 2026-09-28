import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RealWeatherProvider, getWeatherProvider } from './RealWeatherProvider';
import { MockWeatherProvider } from './MockWeatherProvider';

describe('RealWeatherProvider & Provider Factory', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('getWeatherProvider returns RealWeatherProvider when useReal is true', () => {
    const provider = getWeatherProvider(true);
    expect(provider).toBeInstanceOf(RealWeatherProvider);
  });

  it('getWeatherProvider returns MockWeatherProvider when useReal is false', () => {
    const provider = getWeatherProvider(false);
    expect(provider).toBeInstanceOf(MockWeatherProvider);
  });

  it('falls back to MockWeatherProvider when network request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

    const provider = new RealWeatherProvider();
    const data = await provider.getWeatherData('noida-01');

    expect(data).toBeDefined();
    expect(data.location.name).toBe('Sector 2, Noida');
    expect(data.current.temperature).toBeDefined();
  });

  it('normalizes Open-Meteo REST response correctly on successful fetch', async () => {
    const mockWeatherResponse = {
      current: {
        temperature_2m: 29.4,
        apparent_temperature: 31.2,
        relative_humidity_2m: 62,
        wind_speed_10m: 14.5,
        weather_code: 0,
        surface_pressure: 1012
      },
      daily: {
        time: ['2026-09-29', '2026-09-30'],
        temperature_2m_max: [32, 33],
        temperature_2m_min: [22, 23],
        weather_code: [0, 1],
        uv_index_max: [8, 7],
        precipitation_probability_max: [10, 20]
      },
      hourly: {
        time: ['2026-09-29T00:00', '2026-09-29T01:00', '2026-09-29T02:00'],
        temperature_2m: [29, 28, 27],
        relative_humidity_2m: [60, 62, 65],
        precipitation_probability: [0, 5, 10],
        weather_code: [0, 0, 0]
      }
    };

    const mockAqiResponse = {
      current: {
        us_aqi: 85,
        pm2_5: 28,
        pm10: 55
      }
    };

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('air-quality')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAqiResponse) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockWeatherResponse) });
    }));

    const provider = new RealWeatherProvider();
    const data = await provider.getWeatherData('noida-01');

    expect(data.current.temperature).toBe(29);
    expect(data.current.feelsLike).toBe(31);
    expect(data.current.humidity).toBe(62);
    expect(data.airQuality.aqi).toBe(85);
    expect(data.daily.length).toBe(2);
    expect(data.hourly.length).toBeGreaterThan(0);
  });

  it('serves data from cache on subsequent calls within TTL', async () => {
    const mockWeatherResponse = {
      current: { temperature_2m: 25, relative_humidity_2m: 50, weather_code: 0 },
      daily: { time: ['2026-09-29'], temperature_2m_max: [28], temperature_2m_min: [18] }
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWeatherResponse)
    });
    vi.stubGlobal('fetch', fetchSpy);

    const provider = new RealWeatherProvider();

    // First call -> triggers network fetch
    const data1 = await provider.getWeatherData('noida-01');
    const callCountAfterFirst = fetchSpy.mock.calls.length;

    // Second call -> cached, should NOT call fetch again
    const data2 = await provider.getWeatherData('noida-01');

    expect(fetchSpy.mock.calls.length).toBe(callCountAfterFirst);
    expect(data2.current.temperature).toBe(data1.current.temperature);
  });
});
