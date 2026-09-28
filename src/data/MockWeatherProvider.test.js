import { describe, it, expect } from 'vitest';
import { MockWeatherProvider } from './MockWeatherProvider';

describe('MockWeatherProvider Data Layer', () => {
  const provider = new MockWeatherProvider();

  it('fetches valid normalized weather data for Noida', async () => {
    const data = await provider.getWeatherData('noida-01');
    expect(data.location.name).toContain('Noida');
    expect(data.current.temperature).toBeDefined();
    expect(data.airQuality?.aqi).toBe(185);
    expect(data.alerts.length).toBeGreaterThan(0);
    expect(data.alerts[0].severity).toBe('Orange');
  });

  it('fetches valid marine weather data for Mumbai', async () => {
    const data = await provider.getWeatherData('mumbai-01');
    expect(data.location.isCoastal).toBe(true);
    expect(data.marine).toBeDefined();
    expect(data.marine?.waveHeight).toBe(1.8);
    expect(data.marine?.seaCondition).toBe('Moderate');
  });

  it('fetches agriculture data for Punjab farm', async () => {
    const data = await provider.getWeatherData('ludhiana-01');
    expect(data.location.isAgriRegion).toBe(true);
    expect(data.agri).toBeDefined();
    expect(data.agri?.soilMoisture).toBe(42);
    expect(data.agri?.irrigationAdvice).toContain('adequate');
  });

  it('falls back gracefully to default location for unknown location ID', async () => {
    const data = await provider.getWeatherData('unknown-id');
    expect(data).toBeDefined();
    expect(data.location.id).toBe('noida-01');
  });

  it('filters locations by search query', async () => {
    const results = await provider.searchLocations('Goa');
    expect(results).toHaveLength(1);
    expect(results[0].name).toContain('Goa');
  });
});
