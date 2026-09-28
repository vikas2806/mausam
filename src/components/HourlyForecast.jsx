import React from 'react';

// Weather condition → emoji icon map
const CONDITION_ICONS = {
  fog: '🌫️',
  rain: '🌧️',
  storm: '⛈️',
  snow: '❄️',
  cloudy: '☁️',
  partly: '⛅',
  sunny: '☀️',
  clear: '☀️',
  wind: '💨',
  haze: '🌁',
  breezy: '🌬️',
  cold: '🥶',
  default: '🌤️'
};

export function getConditionIcon(conditionCode = '') {
  const key = conditionCode.toLowerCase();
  for (const [k, v] of Object.entries(CONDITION_ICONS)) {
    if (key.includes(k)) return v;
  }
  return CONDITION_ICONS.default;
}

/**
 * Renders the 3-hourly forecast horizontal scroll strip.
 */
export function HourlyForecast({ hourly = [] }) {
  if (!hourly || hourly.length === 0) {
    return null;
  }

  return (
    <div className="glass-card" style={{ marginBottom: '14px', padding: '12px 0 8px' }}>
      <div className="hourly-strip">
        {hourly.map((item, idx) => (
          <div key={idx} className="hourly-item">
            <div className="hourly-time">{item.timestamp}</div>
            <div className="hourly-icon">{getConditionIcon(item.icon)}</div>
            <div className="hourly-temp">{item.temperature}°</div>
            <div className="hourly-humidity">💧{item.humidity}</div>
            <div className="hourly-rain">
              {item.rainProbability > 0 ? `🌧 ${item.rainProbability}%` : 'No Rain'}
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
        <span style={{
          fontSize: '0.8rem',
          background: 'rgba(255,255,255,0.15)',
          padding: '4px 20px',
          borderRadius: '9999px',
          cursor: 'pointer'
        }}>
          3 Hourly &gt;
        </span>
      </div>
    </div>
  );
}
