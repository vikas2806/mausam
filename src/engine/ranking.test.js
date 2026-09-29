import { describe, it, expect, vi } from 'vitest';
import PERSONAS from '../config/personas.json';
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

// ── evaluateThreshold (backwards-compat export) ───────────────────────────────

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

// ── calcDangerBoost ───────────────────────────────────────────────────────────
// Pass explicit persona objects so tests are independent of default config.

const healthPersona = {
  id: 'health',
  cards: ['aqi', 'uvIndex', 'pollen', 'humidity'],
  cardWeights: { aqi: 40, uvIndex: 30, pollen: 25, humidity: 20 },
  dangerRules: [
    { card: 'aqi',     condition: '> 150', boost: 50 },
    { card: 'uvIndex', condition: '>= 8',  boost: 50 },
    { card: 'humidity',condition: '>= 85', boost: 20 }
  ],
  timeRules: []
};

const commutePersona = {
  id: 'commute',
  cards: ['commuteRisk', 'visibility', 'rainAlert'],
  cardWeights: { commuteRisk: 45, visibility: 40, rainAlert: 30 },
  dangerRules: [
    { card: 'visibility', condition: '<= 1',  boost: 50 },
    { card: 'rainAlert',  condition: '>= 70', boost: 50 }
  ],
  timeRules: [
    { card: 'commuteRisk', startHour: 7,  endHour: 10, boost: 20 },
    { card: 'commuteRisk', startHour: 17, endHour: 20, boost: 20 }
  ]
};

const fitnessPersona = {
  id: 'fitness',
  cards: ['bestRunningHours', 'uvIndex', 'wind', 'sunrise'],
  cardWeights: { bestRunningHours: 45, uvIndex: 25, wind: 20, sunrise: 15 },
  dangerRules: [
    { card: 'uvIndex', condition: '>= 8',  boost: 50 },
    { card: 'wind',    condition: '>= 40', boost: 30 }
  ],
  timeRules: [
    { card: 'bestRunningHours', startHour: 5,  endHour: 7,  boost: 20 },
    { card: 'bestRunningHours', startHour: 18, endHour: 20, boost: 20 }
  ]
};

const beachPersona = {
  id: 'beach',
  cards: ['marine', 'uvIndex', 'wind'],
  cardWeights: { marine: 50, uvIndex: 25, wind: 20 },
  dangerRules: [
    { card: 'marine',  condition: '>= 2.5', boost: 50 },
    { card: 'uvIndex', condition: '>= 8',   boost: 50 },
    { card: 'wind',    condition: '>= 40',  boost: 30 }
  ],
  timeRules: [
    { card: 'marine', startHour: 6, endHour: 10, boost: 20 }
  ]
};

const agriPersona = {
  id: 'agri',
  cards: ['soilMoisture', 'rainAlert', 'frostAlert'],
  cardWeights: { soilMoisture: 50, rainAlert: 35, frostAlert: 40 },
  dangerRules: [{ card: 'rainAlert', condition: '>= 70', boost: 50 }],
  timeRules: []
};

describe('calcDangerBoost', () => {
  it('adds +50 boost when AQI exceeds 150', () => {
    expect(calcDangerBoost('aqi', dangerousWeather, [healthPersona])).toBe(50);
  });

  it('returns 0 when AQI is below threshold', () => {
    expect(calcDangerBoost('aqi', baseWeather, [healthPersona])).toBe(0);
  });

  it('adds +50 boost when UV index is 8 or above', () => {
    expect(calcDangerBoost('uvIndex', dangerousWeather, [healthPersona])).toBe(50);
  });

  it('adds +50 boost when rain probability >= 70%', () => {
    expect(calcDangerBoost('rainAlert', dangerousWeather, [commutePersona])).toBe(50);
  });

  it('adds +50 boost when visibility <= 1km', () => {
    expect(calcDangerBoost('visibility', dangerousWeather, [commutePersona])).toBe(50);
  });

  it('returns 0 for cards with no danger rules', () => {
    expect(calcDangerBoost('sunrise', baseWeather, [fitnessPersona])).toBe(0);
  });
});

// ── calcTimeBoost ─────────────────────────────────────────────────────────────

describe('calcTimeBoost', () => {
  it('adds boost for running card during early morning window', () => {
    expect(calcTimeBoost('bestRunningHours', 6, [fitnessPersona])).toBe(20);
  });

  it('adds boost for running card during evening window', () => {
    expect(calcTimeBoost('bestRunningHours', 19, [fitnessPersona])).toBe(20);
  });

  it('adds no boost for running card outside windows', () => {
    expect(calcTimeBoost('bestRunningHours', 14, [fitnessPersona])).toBe(0);
  });

  it('adds boost for commute card during morning rush', () => {
    expect(calcTimeBoost('commuteRisk', 8, [commutePersona])).toBe(20);
  });

  it('adds boost for marine card during beach morning hours', () => {
    expect(calcTimeBoost('marine', 7, [beachPersona])).toBe(20);
  });

  it('returns 0 for cards with no time windows', () => {
    expect(calcTimeBoost('aqi', 10, [healthPersona])).toBe(0);
  });
});

// ── isCardAvailable ───────────────────────────────────────────────────────────

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

// ── scoreCard ─────────────────────────────────────────────────────────────────

describe('scoreCard', () => {
  const registry = [healthPersona, commutePersona, fitnessPersona, beachPersona, agriPersona];

  it('scores 0 when card is irrelevant to active personas', () => {
    // marine not in health/commute
    expect(scoreCard('marine', ['health', 'commute'], baseWeather, 10, registry)).toBe(0);
  });

  it('computes base score from personaWeight (single persona)', () => {
    // health → aqi weight 40, no danger (aqi 90), no time boost
    expect(scoreCard('aqi', ['health'], baseWeather, 10, registry)).toBe(40);
  });

  it('adds dangerBoost on top of personaWeight', () => {
    // health → aqi weight 40 + dangerBoost 50 (aqi 200 > 150)
    expect(scoreCard('aqi', ['health'], dangerousWeather, 10, registry)).toBe(90);
  });

  it('adds timeBoost for relevant time window', () => {
    // fitness → bestRunningHours weight 45 + timeBoost 20 at 06:00
    expect(scoreCard('bestRunningHours', ['fitness'], baseWeather, 6, registry)).toBe(65);
  });

  it('sums weights additively when same card exists in multiple active personas', () => {
    // uvIndex: health=30 + fitness=25 = 55 (additive merge, not max)
    expect(scoreCard('uvIndex', ['health', 'fitness'], baseWeather, 10, registry)).toBe(55);
  });
});

// ── rankCards ─────────────────────────────────────────────────────────────────

describe('rankCards', () => {
  const registry = [healthPersona, commutePersona, fitnessPersona, beachPersona, agriPersona];

  it('returns ranked cards sorted by score descending', () => {
    const ranked = rankCards(['health', 'commute'], dangerousWeather, 10, registry);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked).not.toHaveLength(0);
  });

  it('places unavailable cards last in the list', () => {
    const ranked = rankCards(['beach', 'health'], dangerousWeather, 8, registry);
    const marineEntry = ranked.find(r => r.cardId === 'marine');
    const availableEntries = ranked.filter(r => r.isAvailable);
    if (marineEntry && availableEntries.length > 0) {
      const lastAvailableIdx = ranked.indexOf(availableEntries[availableEntries.length - 1]);
      expect(ranked.indexOf(marineEntry)).toBeGreaterThan(lastAvailableIdx);
    }
  });

  it('only includes cards relevant to active personas', () => {
    const ranked = rankCards(['agri'], agriWeather, 10, registry);
    const cardIds = ranked.map(r => r.cardId);
    expect(cardIds).toContain('soilMoisture');
    expect(cardIds).toContain('frostAlert');
  });

  it('returns empty array for empty personas list', () => {
    expect(rankCards([], baseWeather, 10, registry)).toHaveLength(0);
  });

  it('ranks all available cards when Default (show everything) persona is selected', () => {
    const defaultPersona = PERSONAS.find(p => p.id === 'default');
    const testRegistry = [...registry, defaultPersona];
    const ranked = rankCards(['default'], baseWeather, 10, testRegistry);
    expect(ranked.length).toBeGreaterThan(5);
    const availableCardIds = ranked.filter(r => r.isAvailable).map(r => r.cardId);
    expect(availableCardIds).toContain('uvIndex');
    expect(availableCardIds).toContain('humidity');
    expect(availableCardIds).toContain('wind');
  });

  // ── NEW TEST: brand-new persona, zero engine changes required ──────────────
  it('ranks cards for a brand-new persona added to the registry with no engine code change', () => {
    // "night-owl" persona: not in config/personas.json, injected only at test time
    const nightOwlPersona = {
      id: 'night-owl',
      label: 'Night Owl',
      icon: 'Moon',
      desc: 'Late night conditions: visibility, humidity, pollen',
      cards: ['visibility', 'humidity', 'pollen'],
      cardWeights: { visibility: 35, humidity: 20, pollen: 15 },
      dangerRules: [
        { card: 'visibility', condition: '<= 1', boost: 50 }
      ],
      timeRules: [
        { card: 'visibility', startHour: 22, endHour: 24, boost: 10 },
        { card: 'visibility', startHour: 0,  endHour: 5,  boost: 10 }
      ]
    };

    const testRegistry = [...registry, nightOwlPersona];

    // The engine must rank cards purely from the persona object — no code changes
    const ranked = rankCards(['night-owl'], baseWeather, 23, testRegistry);
    const cardIds = ranked.map(r => r.cardId);

    expect(cardIds).toContain('visibility');
    expect(cardIds).toContain('humidity');
    // pollen requires airQuality — present in baseWeather
    expect(cardIds).toContain('pollen');

    // visibility should score 35 (weight) + 10 (time: hour 23 in [22,24)) = 45
    const visEntry = ranked.find(r => r.cardId === 'visibility');
    expect(visEntry.score).toBe(45);

    // humidity should score 20 (no danger/time boost at 23:00 for this persona)
    const humEntry = ranked.find(r => r.cardId === 'humidity');
    expect(humEntry.score).toBe(20);

    // visibility must outrank humidity
    expect(ranked.indexOf(visEntry)).toBeLessThan(ranked.indexOf(humEntry));
  });
});
