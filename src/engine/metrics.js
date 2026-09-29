/**
 * Pure derived metric functions for Mausam Personalized Homepage.
 * All functions are stateless — same inputs always produce same outputs.
 * No API calls, no side effects.
 */

// ── 1. BEST RUNNING HOURS ─────────────────────────────────────────────────

/**
 * Candidate running windows with their UV multiplier (lower UV is better in morning/evening).
 * Score is computed from temperature, AQI, humidity, and time preference.
 */
const RUNNING_WINDOWS = [
  { label: '5–7 AM',   uvPenaltyFactor: 0.0, tempEstimate: -4 },  // Coolest, no UV
  { label: '6–8 AM',   uvPenaltyFactor: 0.1, tempEstimate: -3 },
  { label: '7–9 AM',   uvPenaltyFactor: 0.3, tempEstimate: -2 },
  { label: '18–20 PM', uvPenaltyFactor: 0.2, tempEstimate: +1 },   // Post-peak heat
  { label: '19–21 PM', uvPenaltyFactor: 0.0, tempEstimate: +0 },   // UV near zero
];

/**
 * Calculate a 0–100 running score for a window given weather conditions.
 * Higher = better conditions for running.
 *
 * @param {object} window  - Running window definition
 * @param {number} currentTemp - Current temperature in °C
 * @param {number} aqi         - Current AQI (or 0 if unavailable)
 * @param {number} humidity    - Current humidity %
 * @param {number} uvIndex     - Current UV index
 * @returns {number} score 0–100
 */
function scoreRunningWindow(window, currentTemp, aqi, humidity, uvIndex) {
  const estimatedTemp = currentTemp + window.tempEstimate;

  // Temperature score: ideal ~18-22°C; penalise heat and cold
  const tempScore = Math.max(0, 40 - Math.abs(estimatedTemp - 20) * 1.5);

  // AQI score: ideal 0–50; penalise poor air
  const aqiScore = Math.max(0, 30 - (aqi / 5));

  // Humidity penalty: ideal < 60%
  const humidityPenalty = Math.max(0, (humidity - 60) * 0.3);

  // UV penalty: morning/evening windows have low UV; midday windows penalised
  const uvPenalty = uvIndex * window.uvPenaltyFactor * 2;

  return Math.max(0, Math.min(100, tempScore + aqiScore - humidityPenalty - uvPenalty));
}

export const RUNNING_SCORE_THRESHOLDS = {
  EXCELLENT: 70,
  ACCEPTABLE: 45
};

/**
 * Determine the best 2-hour running window given current weather data.
 *
 * @param {import('../data/types').NormalizedWeatherData} weatherData
 * @returns {{ window: string, score: number, tip: string, displayLabel?: string }}
 */
export function bestRunningHours(weatherData) {
  const { current, airQuality } = weatherData;
  const temp     = current?.temperature ?? 25;
  const aqi      = airQuality?.aqi ?? 0;
  const humidity = current?.humidity ?? 50;
  const uv       = current?.uvIndex ?? 0;

  let bestWindow = RUNNING_WINDOWS[0];
  let bestScore  = -1;

  for (const window of RUNNING_WINDOWS) {
    const score = scoreRunningWindow(window, temp, aqi, humidity, uv);
    if (score > bestScore) {
      bestScore  = score;
      bestWindow = window;
    }
  }

  const score = Math.round(bestScore);
  
  // Identify actual limiting factors from computed metrics
  const limitingFactors = [];
  if (temp > 28) limitingFactors.push(`high temperature (${temp}°C)`);
  if (humidity > 70) limitingFactors.push(`high humidity (${humidity}%)`);
  if (current?.windSpeed > 30) limitingFactors.push(`strong wind (${current.windSpeed} km/h)`);
  if (airQuality && aqi > 100) limitingFactors.push(`poor air quality (${aqi} AQI)`);

  let tip;
  let displayLabel = bestWindow.label;

  if (score >= RUNNING_SCORE_THRESHOLDS.EXCELLENT) {
    tip = `${bestWindow.label} is ideal today — pleasant temperature (${temp}°C) and comfortable conditions.`;
  } else if (score >= RUNNING_SCORE_THRESHOLDS.ACCEPTABLE) {
    const factorMsg = limitingFactors.length > 0 ? ` due to ${limitingFactors.join(' and ')}` : '';
    tip = `${bestWindow.label} is your best option${factorMsg}. Stay hydrated during your run.`;
  } else {
    displayLabel = `Least-bad: ${bestWindow.label}`;
    const factorMsg = limitingFactors.length > 0 ? ` driven by ${limitingFactors.join(' and ')}` : ' due to overall warm conditions';
    tip = `Least-bad window: ${bestWindow.label} (conditions remain poor${factorMsg}). Consider indoor workouts instead.`;
  }

  return { window: displayLabel, rawWindow: bestWindow.label, score, tip };
}

// ── 2. COMFORT INDEX ──────────────────────────────────────────────────────

/**
 * Compute an outdoor event comfort score (0–100) from temperature, humidity,
 * wind, and rain probability.
 * 100 = perfect outdoor conditions; 0 = stay indoors.
 *
 * @param {import('../data/types').NormalizedWeatherData} weatherData
 * @returns {{ score: number, label: string, description: string }}
 */
export function comfortIndex(weatherData) {
  const { current, daily } = weatherData;
  const temp     = current?.temperature ?? 25;
  const humidity = current?.humidity ?? 50;
  const wind     = current?.windSpeed ?? 10;
  const rainProb = daily?.[0]?.rainProbability ?? 0;

  // Penalty for heat beyond 28°C (ideal outdoor temp) — quadratic boost above 35°C
  const heatPenalty = Math.max(0, (temp - 28) * 3) + Math.max(0, (temp - 35) * 2);

  // Penalty for cold below 15°C
  const coldPenalty = Math.max(0, (15 - temp) * 1.5);

  // Penalty for high humidity — stronger weight for very humid conditions
  const humidPenalty = Math.max(0, (humidity - 60) * 0.7);

  // Penalty for high rain probability
  const rainPenalty = rainProb * 0.35;

  // Bonus for light breeze (10–25 km/h improves comfort)
  const windBonus = wind >= 10 && wind <= 25 ? 5 : 0;

  // Penalty for strong wind
  const windPenalty = Math.max(0, (wind - 30) * 0.4);

  const raw = 100 - heatPenalty - coldPenalty - humidPenalty - rainPenalty + windBonus - windPenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  let label, description;
  if (score >= 75) {
    label = 'Excellent';
    description = 'Perfect outdoor event conditions. Low risk of weather disruption.';
  } else if (score >= 55) {
    label = 'Good';
    description = 'Comfortable for outdoor events. Light shade and hydration recommended.';
  } else if (score >= 35) {
    label = 'Moderate';
    description = 'Acceptable conditions, but heat, rain or humidity may cause discomfort.';
  } else {
    label = 'Poor';
    description = 'Uncomfortable outdoor conditions. Have an indoor backup plan ready.';
  }

  return { score, label, description };
}

// ── 3. COMMUTE RISK ───────────────────────────────────────────────────────

/**
 * Evaluate commute safety based on visibility, rain, alerts, and fog.
 *
 * @param {import('../data/types').NormalizedWeatherData} weatherData
 * @returns {{ level: 'Low'|'Moderate'|'High'|'Severe', description: string, leaveBy: string|null }}
 */
export function commuteRisk(weatherData) {
  const { current, daily, alerts } = weatherData;
  const visibility = current?.visibility ?? 10;
  const rain       = daily?.[0]?.rainProbability ?? 0;
  const condCode   = (current?.conditionCode ?? '').toLowerCase();
  const hasFog     = condCode.includes('fog') || condCode.includes('haze');
  const hasActiveRedOrange = alerts?.some(a => a.severity === 'Red' || a.severity === 'Orange') ?? false;

  if (hasActiveRedOrange || visibility <= 0.5) {
    return {
      level: 'Severe',
      description: 'Extremely dangerous road conditions. Avoid non-essential travel. Follow IMD / traffic advisories.',
      leaveBy: null
    };
  }

  if (visibility <= 1 || rain >= 70 || hasFog) {
    return {
      level: 'High',
      description: 'Dense fog or heavy rain expected. Leave 20–30 min early; use fog lights; maintain low speed.',
      leaveBy: 'Leave by 7:30 AM'
    };
  }

  if (visibility <= 4 || rain >= 40) {
    return {
      level: 'Moderate',
      description: 'Reduced visibility or light showers possible. Allow extra travel buffer.',
      leaveBy: 'Leave by 8:00 AM'
    };
  }

  return {
    level: 'Low',
    description: 'Clear commute conditions today. Normal traffic patterns expected.',
    leaveBy: null
  };
}

// ── 4. PACKING SUGGESTION ─────────────────────────────────────────────────

/**
 * Rule-based packing suggestion list for the current weather conditions.
 *
 * @param {import('../data/types').NormalizedWeatherData} weatherData
 * @returns {{ items: string[], summary: string }}
 */
export function packingSuggestion(weatherData) {
  const { current, daily, airQuality, marine } = weatherData;
  const temp     = current?.temperature ?? 25;
  const wind     = current?.windSpeed ?? 10;
  const uv       = current?.uvIndex ?? 5;
  const humidity = current?.humidity ?? 50;
  const rain     = daily?.[0]?.rainProbability ?? 0;
  const aqi      = airQuality?.aqi ?? 0;
  const wave     = marine?.waveHeight ?? 0;

  const items = [];

  if (rain >= 40)    items.push('☂️ Carry an umbrella or raincoat');
  if (uv >= 6)       items.push('🧴 Apply sunscreen SPF 30+');
  if (temp <= 15)    items.push('🧥 Wear a warm jacket or fleece');
  if (temp <= 5)     items.push('🧤 Thermal gloves and a woolly hat');
  if (aqi > 150)     items.push('😷 Wear an N95/FFP2 mask outdoors');
  if (wind >= 30)    items.push('🧣 Bring a windproof outer layer');
  if (humidity >= 80)items.push('💧 Stay hydrated; wear breathable fabric');
  if (wave >= 2.5)   items.push('🌊 Do not swim — rough sea conditions');

  const summary = items.length === 0
    ? 'Light casual wear is fine today. No special gear needed.'
    : items.join(' · ');

  return { items, summary };
}
