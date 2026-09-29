import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenWeatherProvider } from './openWeatherProvider';

describe('OpenWeatherProvider', () => {
  let provider;

  beforeEach(() => {
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
});
