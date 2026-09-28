import { describe, it, expect } from 'vitest';
import {
  scoreCard,
  rankCards,
  evaluateThreshold,
  calcDangerBoost,
  calcTimeBoost,
  isCardAvailable
} from './ranking';

// ── Shared mock weather data ──────────────────────────────────────────────────

const baseWeather = {
  location: { id: 'noida-01', isCoastal: false, isAgriRegion: false },
  current: {
    temperature: 25,
    feelsLike: 27,
    humidity: 60,
    windSpeed: 15,
    uvIndex: 5,
    visibility: 8,
    sunrise: '06:30',
    sunset: '18:00',
    conditionText: 'Clear',
    conditionCode: 'clear',
    tempMin: 18,
    tempMax: 32,
    windDirection: 'NW',
    pressure: 1015
  },
  hourly: [],
  daily: [{ date: '12/01', dayName: 'Today', tempMin: 18, tempMax: 32, conditionText: 'Clear', rainProbability: 10, icon: 'sun' }],
  airQuality: { aqi: 90, pm25: 28, pm10: 55, category: 'Moderate', pollenCount: 30 },
  alerts: []
};

const dangerousWeather = {
  ...baseWeather,
  current: { ...baseWeather.current, uvIndex: 9, temperature: 42, humidity: 88, windSpeed: 45, visibility: 0.5 },
  airQuality: { aqi: 200, pm25: 130, pm10: 210, category: 'Poor' },
  daily: [{ ...baseWeather.daily[0], rainProbability: 80 }]
};

const coastalWeather = {
  ...baseWeather,
  marine: { waveHeight: 1.2, waterTemp: 28, tideHighTime: '10:00 AM', tideLowTime: '04:00 PM', seaCondition: 'Calm' }
};

const agriWeather = {
  ...baseWeather,
  agri: { soilMoisture: 42, soilTemp: 18, frostRisk: false, irrigationAdvice: 'Adequate moisture.' }
};

// ── Unit tests ────────────────────────────────────────────────────────────────

describe('evaluateThreshold', () => {
  it('evaluates gt operator correctly', () => {
    expect(evaluateThreshold(200, 150, 'gt')).toBe(true);
    expect(evaluateThreshold(100, 150, 'gt')).toBe(false);
  });

  it('evaluates gte operator correctly', () => {
    expect(evaluateThreshold(8, 8, 'gte')).toBe(true);
    expect(evaluateThreshold(7, 8, 'gte')).toBe(false);
  });

  it('evaluates lte operator correctly', () => {
    expect(evaluateThreshold(0.5, 1, 'lte')).toBe(true);
    expect(evaluateThreshold(1.5, 1, 'lte')).toBe(false);
  });

  it('returns false for undefined actual value', () => {
    expect(evaluateThreshold(undefined, 100, 'gt')).toBe(false);
  });
});

describe('calcDangerBoost', () => {
  it('adds +50 boost when AQI exceeds 150', () => {
    expect(calcDangerBoost('aqi', dangerousWeather)).toBe(50);
  });

  it('returns 0 when AQI is below threshold', () => {
    expect(calcDangerBoost('aqi', baseWeather)).toBe(0);
  });

  it('adds +50 boost when UV index is 8 or above', () => {
    expect(calcDangerBoost('uvIndex', dangerousWeather)).toBe(50);
  });

  it('adds +50 boost when rain probability >= 70%', () => {
    expect(calcDangerBoost('rainAlert', dangerousWeather)).toBe(50);
  });

  it('adds +50 boost when visibility <= 1km', () => {
    expect(calcDangerBoost('visibility', dangerousWeather)).toBe(50);
  });

  it('returns 0 for cards with no metric mapping', () => {
    expect(calcDangerBoost('sunrise', baseWeather)).toBe(0);
  });
});

describe('calcTimeBoost', () => {
  it('adds boost for running card during early morning window', () => {
    expect(calcTimeBoost('bestRunningHours', 6)).toBe(20);
  });

  it('adds boost for running card during evening window', () => {
    expect(calcTimeBoost('bestRunningHours', 19)).toBe(20);
  });

  it('adds no boost for running card outside windows', () => {
    expect(calcTimeBoost('bestRunningHours', 14)).toBe(0);
  });

  it('adds boost for commute card during morning rush', () => {
    expect(calcTimeBoost('commuteRisk', 8)).toBe(20);
  });

  it('adds boost for marine card during beach morning hours', () => {
    expect(calcTimeBoost('marine', 7)).toBe(20);
  });

  it('returns 0 for cards with no time windows', () => {
    expect(calcTimeBoost('aqi', 10)).toBe(0);
  });
});

describe('isCardAvailable', () => {
  it('marks marine card unavailable when marine data is missing', () => {
    expect(isCardAvailable('marine', baseWeather)).toBe(false);
  });

  it('marks marine card available when marine data is present', () => {
    expect(isCardAvailable('marine', coastalWeather)).toBe(true);
  });

  it('marks agri card unavailable when agri data is missing', () => {
    expect(isCardAvailable('soilMoisture', baseWeather)).toBe(false);
  });

  it('marks agri card available when agri data is present', () => {
    expect(isCardAvailable('soilMoisture', agriWeather)).toBe(true);
  });

  it('marks basic cards always available (no data requirements)', () => {
    expect(isCardAvailable('uvIndex', baseWeather)).toBe(true);
    expect(isCardAvailable('wind', baseWeather)).toBe(true);
  });
});

describe('scoreCard', () => {
  it('scores 0 when card is irrelevant to active personas', () => {
    // marine card is not in health/commute personas
    expect(scoreCard('marine', ['health', 'commute'], baseWeather, 10)).toBe(0);
  });

  it('computes base score from personaWeight', () => {
    // health → aqi weight is 40, no danger (aqi 90), no time boost
    const score = scoreCard('aqi', ['health'], baseWeather, 10);
    expect(score).toBe(40);
  });

  it('adds dangerBoost on top of personaWeight', () => {
    // health → aqi weight 40 + dangerBoost 50 (aqi 200 > 150)
    const score = scoreCard('aqi', ['health'], dangerousWeather, 10);
    expect(score).toBe(90);
  });

  it('adds timeBoost for relevant time window', () => {
    // fitness → bestRunningHours weight 45 + timeBoost 20 at 06:00
    const score = scoreCard('bestRunningHours', ['fitness'], baseWeather, 6);
    expect(score).toBe(65);
  });

  it('takes max weight when same card exists in multiple active personas', () => {
    // uvIndex: health=30, fitness=25 → max=30
    const score = scoreCard('uvIndex', ['health', 'fitness'], baseWeather, 10);
    expect(score).toBe(30);
  });
});

describe('rankCards', () => {
  it('returns ranked cards sorted by score descending', () => {
    const ranked = rankCards(['health', 'commute'], dangerousWeather, 10);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked).not.toHaveLength(0);
  });

  it('places unavailable cards last in the list', () => {
    // marine not available in dangerousWeather (no marine obj)
    const ranked = rankCards(['beach', 'health'], dangerousWeather, 8);
    const marineEntry = ranked.find(r => r.cardId === 'marine');
    const availableEntries = ranked.filter(r => r.isAvailable);
    if (marineEntry && availableEntries.length > 0) {
      const lastAvailableIdx = ranked.indexOf(availableEntries[availableEntries.length - 1]);
      const marineIdx = ranked.indexOf(marineEntry);
      expect(marineIdx).toBeGreaterThan(lastAvailableIdx);
    }
  });

  it('only includes cards relevant to active personas', () => {
    // farming persona should include agri cards
    const ranked = rankCards(['agri'], agriWeather, 10);
    const cardIds = ranked.map(r => r.cardId);
    expect(cardIds).toContain('soilMoisture');
    expect(cardIds).toContain('frostAlert');
  });

  it('returns empty array for empty personas list', () => {
    const ranked = rankCards([], baseWeather, 10);
    expect(ranked).toHaveLength(0);
  });
});
