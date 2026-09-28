import { describe, it, expect } from 'vitest';
import { bestRunningHours, comfortIndex, commuteRisk, packingSuggestion } from './metrics';

// ── Shared fixtures ──────────────────────────────────────────────────────────

const goodWeather = {
  current: { temperature: 20, humidity: 55, windSpeed: 15, uvIndex: 4, visibility: 10, conditionCode: 'clear', conditionText: 'Clear Sky' },
  daily:   [{ rainProbability: 5, tempMin: 14, tempMax: 25, conditionText: 'Clear', date: '12/01', dayName: 'Today', icon: 'sun' }],
  airQuality: { aqi: 60, pm25: 18, pm10: 40, category: 'Satisfactory' },
  alerts: []
};

const hotHumidWeather = {
  current: { temperature: 40, humidity: 90, windSpeed: 5, uvIndex: 10, visibility: 8, conditionCode: 'sunny', conditionText: 'Sunny Hot' },
  daily:   [{ rainProbability: 5, tempMin: 32, tempMax: 42, conditionText: 'Hot', date: '12/01', dayName: 'Today', icon: 'sun' }],
  airQuality: { aqi: 60, pm25: 18, pm10: 40, category: 'Satisfactory' },
  alerts: []
};

const pollutedWeather = {
  current: { temperature: 25, humidity: 65, windSpeed: 10, uvIndex: 5, visibility: 4, conditionCode: 'haze', conditionText: 'Hazy' },
  daily:   [{ rainProbability: 10, tempMin: 18, tempMax: 30, conditionText: 'Hazy', date: '12/01', dayName: 'Today', icon: 'cloud' }],
  airQuality: { aqi: 210, pm25: 140, pm10: 200, category: 'Poor' },
  alerts: []
};

const foggyCommute = {
  current: { temperature: 12, humidity: 99, windSpeed: 8, uvIndex: 2, visibility: 0.8, conditionCode: 'fog', conditionText: 'Dense Fog' },
  daily:   [{ rainProbability: 20, tempMin: 8, tempMax: 16, conditionText: 'Foggy', date: '12/01', dayName: 'Today', icon: 'cloud' }],
  airQuality: { aqi: 180, pm25: 110, pm10: 185, category: 'Poor' },
  alerts: [{ id: 'a1', title: 'Dense Fog Warning', description: '...', severity: 'Orange', issuedAt: '', validUntil: '' }]
};

const rainWeather = {
  current: { temperature: 25, humidity: 80, windSpeed: 20, uvIndex: 3, visibility: 5, conditionCode: 'rain', conditionText: 'Heavy Rain' },
  daily:   [{ rainProbability: 85, tempMin: 20, tempMax: 28, conditionText: 'Heavy Rain', date: '12/01', dayName: 'Today', icon: 'rain' }],
  airQuality: { aqi: 45, pm25: 12, pm10: 28, category: 'Good' },
  alerts: []
};

const beachWeather = {
  current: { temperature: 30, humidity: 78, windSpeed: 18, uvIndex: 9, visibility: 10, conditionCode: 'sunny', conditionText: 'Clear Beach Day' },
  daily:   [{ rainProbability: 0, tempMin: 24, tempMax: 32, conditionText: 'Sunny', date: '12/01', dayName: 'Today', icon: 'sun' }],
  airQuality: { aqi: 40, pm25: 10, pm10: 25, category: 'Good' },
  marine: { waveHeight: 3.0, waterTemp: 28, tideHighTime: '10:00 AM', tideLowTime: '04:00 PM', seaCondition: 'Very Rough' },
  alerts: []
};

// ── bestRunningHours ─────────────────────────────────────────────────────────

describe('bestRunningHours', () => {
  it('returns a window label, score, and tip', () => {
    const result = bestRunningHours(goodWeather);
    expect(result).toHaveProperty('window');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('tip');
    expect(typeof result.window).toBe('string');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('prefers early morning or evening over midday (lower UV windows)', () => {
    const result = bestRunningHours(goodWeather);
    // Good conditions → early morning or evening should win
    expect(['5–7 AM', '6–8 AM', '18–20 PM', '19–21 PM']).toContain(result.window);
  });

  it('returns lower score in hot, humid conditions', () => {
    const goodResult = bestRunningHours(goodWeather);
    const badResult  = bestRunningHours(hotHumidWeather);
    expect(badResult.score).toBeLessThan(goodResult.score);
  });

  it('handles missing airQuality gracefully (defaults aqi to 0)', () => {
    const weatherNoAQI = { ...goodWeather, airQuality: undefined };
    const result = bestRunningHours(weatherNoAQI);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('returns a descriptive tip for poor conditions', () => {
    const result = bestRunningHours(hotHumidWeather);
    expect(result.tip).toMatch(/poor|not perfect|unhealthy|best option/i);
  });
});

// ── comfortIndex ─────────────────────────────────────────────────────────────

describe('comfortIndex', () => {
  it('returns score 0–100, a label, and a description', () => {
    const result = comfortIndex(goodWeather);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.label).toBeDefined();
    expect(result.description).toBeDefined();
  });

  it('scores excellent for mild temperature and low rain', () => {
    const result = comfortIndex(goodWeather);
    expect(result.score).toBeGreaterThan(70);
    expect(result.label).toBe('Excellent');
  });

  it('scores poor for extreme heat + high humidity', () => {
    const result = comfortIndex(hotHumidWeather);
    expect(result.score).toBeLessThan(35);
    expect(result.label).toBe('Poor');
  });

  it('reduces score for high rain probability', () => {
    const dry  = comfortIndex(goodWeather);
    const wet  = comfortIndex(rainWeather);
    expect(wet.score).toBeLessThan(dry.score);
  });

  it('handles missing daily forecast gracefully (defaults rain to 0)', () => {
    const weatherNoDailyRain = { ...goodWeather, daily: undefined };
    const result = comfortIndex(weatherNoDailyRain);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

// ── commuteRisk ───────────────────────────────────────────────────────────────

describe('commuteRisk', () => {
  it('returns level, description, and optional leaveBy', () => {
    const result = commuteRisk(goodWeather);
    expect(['Low', 'Moderate', 'High', 'Severe']).toContain(result.level);
    expect(result.description).toBeTruthy();
  });

  it('returns Low risk for clear, good-visibility weather', () => {
    const result = commuteRisk(goodWeather);
    expect(result.level).toBe('Low');
    expect(result.leaveBy).toBeNull();
  });

  it('returns High risk for dense fog (visibility < 1 km)', () => {
    // Use foggyWeather without Orange alert to isolate visibility rule
    const isolatedFog = { ...foggyCommute, alerts: [] };
    const result = commuteRisk(isolatedFog);
    expect(['High', 'Severe']).toContain(result.level);
  });

  it('returns Severe when Orange alert is active', () => {
    const result = commuteRisk(foggyCommute);
    expect(result.level).toBe('Severe');
    expect(result.leaveBy).toBeNull();
  });

  it('returns High for rain probability >= 70%', () => {
    const result = commuteRisk(rainWeather);
    expect(['High', 'Severe']).toContain(result.level);
  });

  it('returns Moderate for rain probability 40–69%', () => {
    const moderateRain = {
      ...goodWeather,
      daily: [{ rainProbability: 50, tempMin: 18, tempMax: 28, conditionText: 'Showers', date: '12/01', dayName: 'Today', icon: 'rain' }]
    };
    const result = commuteRisk(moderateRain);
    expect(result.level).toBe('Moderate');
    expect(result.leaveBy).toBeTruthy();
  });
});

// ── packingSuggestion ─────────────────────────────────────────────────────────

describe('packingSuggestion', () => {
  it('returns items array and a summary string', () => {
    const result = packingSuggestion(goodWeather);
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.summary).toBe('string');
  });

  it('suggests no gear for mild conditions', () => {
    const result = packingSuggestion(goodWeather);
    expect(result.items).toHaveLength(0);
    expect(result.summary).toMatch(/no special gear/i);
  });

  it('suggests umbrella when rain probability >= 40%', () => {
    const result = packingSuggestion(rainWeather);
    expect(result.items.some(i => i.includes('umbrella'))).toBe(true);
  });

  it('suggests sunscreen when UV >= 6', () => {
    const result = packingSuggestion(beachWeather);
    expect(result.items.some(i => i.includes('sunscreen'))).toBe(true);
  });

  it('suggests N95 mask when AQI > 150', () => {
    const result = packingSuggestion(pollutedWeather);
    expect(result.items.some(i => i.includes('N95'))).toBe(true);
  });

  it('warns against swimming when wave height >= 2.5 m', () => {
    const result = packingSuggestion(beachWeather);
    expect(result.items.some(i => i.includes('swim'))).toBe(true);
  });

  it('suggests warm jacket when temperature <= 15°C', () => {
    const result = packingSuggestion(foggyCommute);
    expect(result.items.some(i => i.includes('jacket') || i.includes('fleece'))).toBe(true);
  });

  it('accumulates multiple suggestions for complex conditions', () => {
    // foggy = cold + hazy → expects jacket + mask at minimum
    const result = packingSuggestion(foggyCommute);
    expect(result.items.length).toBeGreaterThan(1);
  });
});
