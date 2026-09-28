/**
 * Pure ranking engine for Mausam Personalized Homepage.
 * score = personaWeight + dangerBoost + timeBoost
 * All functions are pure (no side effects, no API calls).
 */

import PERSONA_CONFIG from '../config/personas.json';

/**
 * Evaluate a single threshold condition.
 * @param {number} actualValue
 * @param {number} thresholdValue
 * @param {'gt'|'gte'|'lt'|'lte'|'eq'} operator
 * @returns {boolean}
 */
function evaluateThreshold(actualValue, thresholdValue, operator) {
  if (actualValue === undefined || actualValue === null) return false;
  switch (operator) {
    case 'gt':  return actualValue > thresholdValue;
    case 'gte': return actualValue >= thresholdValue;
    case 'lt':  return actualValue < thresholdValue;
    case 'lte': return actualValue <= thresholdValue;
    case 'eq':  return actualValue === thresholdValue;
    default:    return false;
  }
}

/**
 * Calculate danger boost for a card based on current weather data values.
 * @param {string} cardId
 * @param {import('../data/types').NormalizedWeatherData} weatherData
 * @returns {number} boost value (0 or positive)
 */
function calcDangerBoost(cardId, weatherData) {
  const thresholds = PERSONA_CONFIG.dangerThresholds;
  const { current, airQuality, marine } = weatherData;

  // Card-to-metric mapping
  const metricMap = {
    aqi: { value: airQuality?.aqi, key: 'aqi' },
    pollen: { value: airQuality?.pollenCount, key: null },
    uvIndex: { value: current?.uvIndex, key: 'uvIndex' },
    temperature: { value: current?.temperature, key: 'temperature' },
    humidity: { value: current?.humidity, key: 'humidity' },
    wind: { value: current?.windSpeed, key: 'windSpeed' },
    visibility: { value: current?.visibility, key: 'visibility' },
    rainAlert: { value: weatherData.daily?.[0]?.rainProbability, key: 'rainProbability' },
    marine: { value: marine?.waveHeight, key: 'waveHeight' },
    bestRunningHours: { value: current?.temperature, key: 'temperature' },
    commuteRisk: { value: current?.visibility, key: 'visibility' },
    comfortIndex: { value: current?.humidity, key: 'humidity' }
  };

  const metric = metricMap[cardId];
  if (!metric || metric.value === undefined || metric.value === null) return 0;
  if (!metric.key || !thresholds[metric.key]) return 0;

  const threshold = thresholds[metric.key];
  return evaluateThreshold(metric.value, threshold.value, threshold.operator)
    ? threshold.boost
    : 0;
}

/**
 * Calculate time-of-day boost for a card.
 * @param {string} cardId
 * @param {number} currentHour  0-23 integer
 * @returns {number} boost value (0 or positive)
 */
function calcTimeBoost(cardId, currentHour) {
  const windows = PERSONA_CONFIG.timeWindows[cardId];
  if (!windows) return 0;

  for (const window of windows) {
    if (currentHour >= window.startHour && currentHour < window.endHour) {
      return window.boost;
    }
  }
  return 0;
}

/**
 * Check if the weather data contains the required sub-objects for a card.
 * Cards missing required data are marked unavailable and hidden from scoring.
 * @param {string} cardId
 * @param {import('../data/types').NormalizedWeatherData} weatherData
 * @returns {boolean}
 */
function isCardAvailable(cardId, weatherData) {
  const requirements = PERSONA_CONFIG.cardDataRequirements[cardId] || [];
  return requirements.every(req => weatherData[req] !== undefined && weatherData[req] !== null);
}

/**
 * Compute the score for a single card given active personas and weather data.
 * @param {string} cardId
 * @param {string[]} activePersonas
 * @param {import('../data/types').NormalizedWeatherData} weatherData
 * @param {number} currentHour
 * @returns {number} total score
 */
export function scoreCard(cardId, activePersonas, weatherData, currentHour) {
  let personaWeight = 0;

  for (const personaId of activePersonas) {
    const cards = PERSONA_CONFIG.personaCards[personaId] || [];
    const cardConfig = cards.find(c => c.cardId === cardId);
    if (cardConfig) {
      personaWeight = Math.max(personaWeight, cardConfig.weight);
    }
  }

  // Card irrelevant to all active personas — score 0
  if (personaWeight === 0) return 0;

  const dangerBoost = calcDangerBoost(cardId, weatherData);
  const timeBoost = calcTimeBoost(cardId, currentHour);

  return personaWeight + dangerBoost + timeBoost;
}

/**
 * Build a ranked list of card IDs for the personalized homepage.
 * Cards are sorted by score descending, unavailable cards are excluded.
 *
 * @param {string[]} activePersonas
 * @param {import('../data/types').NormalizedWeatherData} weatherData
 * @param {number} [currentHour]  Defaults to the current local hour.
 * @returns {{ cardId: string, score: number, isAvailable: boolean }[]}
 */
export function rankCards(activePersonas, weatherData, currentHour = new Date().getHours()) {
  // Collect all unique card IDs relevant to active personas
  const candidateCardIds = new Set();
  for (const personaId of activePersonas) {
    const cards = PERSONA_CONFIG.personaCards[personaId] || [];
    cards.forEach(c => candidateCardIds.add(c.cardId));
  }

  const results = [];
  for (const cardId of candidateCardIds) {
    const available = isCardAvailable(cardId, weatherData);
    const score = available
      ? scoreCard(cardId, activePersonas, weatherData, currentHour)
      : 0;

    results.push({ cardId, score, isAvailable: available });
  }

  // Sort by score descending; unavailable last
  return results.sort((a, b) => {
    if (!a.isAvailable && b.isAvailable) return 1;
    if (a.isAvailable && !b.isAvailable) return -1;
    return b.score - a.score;
  });
}

// Re-export config helpers for tests
export { evaluateThreshold, calcDangerBoost, calcTimeBoost, isCardAvailable };
