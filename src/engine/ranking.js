/**
 * Pure ranking engine for Mausam Personalized Homepage.
 * score = personaWeight + dangerBoost + timeBoost
 *
 * Fully data-driven: reads persona definitions from config/personas.json
 * and card metadata from config/cardConfig.json.
 * Never branches on a persona's id or name — only on its data fields.
 *
 * All functions are pure (no side effects, no API calls).
 */

import PERSONAS from '../config/personas.json';
import CARD_CONFIG from '../config/cardConfig.json';

// ── Condition parser ──────────────────────────────────────────────────────────

/**
 * Parse a condition string like "> 150", "<= 1", ">= 8" into operator + value.
 * @param {string} condition
 * @returns {{ operator: string, value: number }}
 */
function parseCondition(condition) {
  const match = condition.trim().match(/^(>=|<=|>|<|==)\s*(-?\d+\.?\d*)$/);
  if (!match) return null;
  return { operator: match[1], value: parseFloat(match[2]) };
}

/**
 * Evaluate a parsed condition against an actual value.
 * @param {number} actual
 * @param {string} operator  ">", ">=", "<", "<=", "=="
 * @param {number} threshold
 * @returns {boolean}
 */
function evaluateCondition(actual, operator, threshold) {
  if (actual === undefined || actual === null) return false;
  switch (operator) {
    case '>':  return actual > threshold;
    case '>=': return actual >= threshold;
    case '<':  return actual < threshold;
    case '<=': return actual <= threshold;
    case '==': return actual === threshold;
    default:   return false;
  }
}

// Kept for backwards-compat with existing tests
export function evaluateThreshold(actualValue, thresholdValue, operator) {
  // Translate old-style operators (gt/gte/lt/lte/eq) to symbol form
  const opMap = { gt: '>', gte: '>=', lt: '<', lte: '<=', eq: '==' };
  return evaluateCondition(actualValue, opMap[operator] ?? operator, thresholdValue);
}

// ── Metric resolver ───────────────────────────────────────────────────────────

/**
 * Resolve the numeric metric value for a card from weatherData,
 * using cardConfig.cardMetricMap.
 * @param {string} cardId
 * @param {object} weatherData
 * @returns {number|null}
 */
function resolveMetricValue(cardId, weatherData) {
  const mapping = CARD_CONFIG.cardMetricMap[cardId];
  if (!mapping) return null;

  const [root, ...rest] = mapping.field;
  let node = weatherData[root];
  for (const key of rest) {
    if (node === undefined || node === null) return null;
    node = Array.isArray(node) ? node[parseInt(key, 10)] : node[key];
  }
  return node ?? null;
}

// ── Danger boost ──────────────────────────────────────────────────────────────

/**
 * Calculate danger boost for a card from the active persona objects.
 * Reads each persona's dangerRules and evaluates them generically.
 *
 * @param {string} cardId
 * @param {object[]} activePersonaObjects  - full persona definition objects
 * @param {object} weatherData
 * @returns {number}
 */
export function calcDangerBoost(cardId, weatherData, activePersonaObjects = PERSONAS) {
  let maxBoost = 0;

  for (const persona of activePersonaObjects) {
    for (const rule of (persona.dangerRules || [])) {
      if (rule.card !== cardId) continue;
      const parsed = parseCondition(rule.condition);
      if (!parsed) continue;
      const actualValue = resolveMetricValue(cardId, weatherData);
      if (evaluateCondition(actualValue, parsed.operator, parsed.value)) {
        maxBoost = Math.max(maxBoost, rule.boost);
      }
    }
  }

  return maxBoost;
}

// ── Time boost ────────────────────────────────────────────────────────────────

/**
 * Calculate time-of-day boost for a card from the active persona objects.
 * Reads each persona's timeRules generically.
 *
 * @param {string} cardId
 * @param {number} currentHour  0-23
 * @param {object[]} activePersonaObjects
 * @returns {number}
 */
export function calcTimeBoost(cardId, currentHour, activePersonaObjects = PERSONAS) {
  let maxBoost = 0;

  for (const persona of activePersonaObjects) {
    for (const rule of (persona.timeRules || [])) {
      if (rule.card !== cardId) continue;
      if (currentHour >= rule.startHour && currentHour < rule.endHour) {
        maxBoost = Math.max(maxBoost, rule.boost);
      }
    }
  }

  return maxBoost;
}

// ── Card availability ─────────────────────────────────────────────────────────

/**
 * Check if required weather sub-objects for a card are present.
 * @param {string} cardId
 * @param {object} weatherData
 * @returns {boolean}
 */
export function isCardAvailable(cardId, weatherData) {
  const requirements = CARD_CONFIG.cardDataRequirements[cardId] || [];
  return requirements.every(req => weatherData[req] !== undefined && weatherData[req] !== null);
}

// ── Score card ────────────────────────────────────────────────────────────────

/**
 * Compute the score for a single card given active persona IDs and weather data.
 *
 * Merging strategy when multiple personas are active:
 *   - Weights: sum overlapping weights (additive, as specified)
 *   - DangerRules: union — take max boost across all personas
 *   - TimeRules:   union — take max boost across all personas
 *
 * @param {string}   cardId
 * @param {string[]} activePersonaIds
 * @param {object}   weatherData
 * @param {number}   currentHour
 * @param {object[]} [personaRegistry]  Defaults to PERSONAS from config; injectable for tests.
 * @returns {number}
 */
export function scoreCard(cardId, activePersonaIds, weatherData, currentHour, personaRegistry = PERSONAS) {
  // Build the set of active persona definition objects
  const activePersonaObjects = personaRegistry.filter(p => activePersonaIds.includes(p.id));

  // Sum weights additively across all active personas (union + additive merge)
  let personaWeight = 0;
  for (const persona of activePersonaObjects) {
    const w = persona.cardWeights?.[cardId] ?? 0;
    personaWeight += w;
  }

  // Card irrelevant to all active personas — score 0
  if (personaWeight === 0) return 0;

  const dangerBoost = calcDangerBoost(cardId, weatherData, activePersonaObjects);
  const timeBoost   = calcTimeBoost(cardId, currentHour, activePersonaObjects);

  return personaWeight + dangerBoost + timeBoost;
}

// ── Rank cards ────────────────────────────────────────────────────────────────

/**
 * Build a ranked list of card IDs for the personalized homepage.
 * Cards are sorted by score descending; unavailable cards are sorted last.
 *
 * Accepts an optional personaRegistry (array of persona objects) so that
 * tests and "Build your own persona" custom personas can inject extra definitions
 * without any code change to this engine.
 *
 * @param {string[]} activePersonaIds
 * @param {object}   weatherData
 * @param {number}   [currentHour]       Defaults to the current local hour.
 * @param {object[]} [personaRegistry]   Defaults to PERSONAS from config.
 * @returns {{ cardId: string, score: number, isAvailable: boolean }[]}
 */
export function rankCards(activePersonaIds, weatherData, currentHour = new Date().getHours(), personaRegistry = PERSONAS) {
  const activePersonaObjects = personaRegistry.filter(p => activePersonaIds.includes(p.id));

  // Collect union of all card IDs across active personas
  const candidateCardIds = new Set();
  for (const persona of activePersonaObjects) {
    for (const cardId of (persona.cards || [])) {
      candidateCardIds.add(cardId);
    }
  }

  const results = [];
  for (const cardId of candidateCardIds) {
    const available = isCardAvailable(cardId, weatherData);
    const score = available
      ? scoreCard(cardId, activePersonaIds, weatherData, currentHour, personaRegistry)
      : 0;
    results.push({ cardId, score, isAvailable: available });
  }

  // Sort by score descending; unavailable last
  return results.sort((a, b) => {
    if (!a.isAvailable && b.isAvailable)  return 1;
    if (a.isAvailable  && !b.isAvailable) return -1;
    return b.score - a.score;
  });
}
