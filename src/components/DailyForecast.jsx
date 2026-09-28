import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getConditionIcon } from './HourlyForecast';

/**
 * Renders the 7-day daily forecast list with temperature range bars.
 */
export function DailyForecast({ daily = [] }) {
  if (!daily || daily.length === 0) return null;

  return (
    <div className="glass-card" style={{ marginBottom: '14px', padding: '4px 16px' }}>
      <div className="daily-list">
        {daily.map((day, idx) => {
          // Normalise bar fill width: each row spans its own range proportionally
          // We show a fixed gradient bar — width 100% always, gradient shows relative temp
          return (
            <div key={idx} className="daily-item">
              <div className="daily-date">{day.date}</div>
              <div className="daily-name">{day.dayName}</div>
              <div className="daily-icon">{getConditionIcon(day.icon)}</div>
              <div className="daily-range">
                <span className="daily-lo">{day.tempMin}°</span>
                <div className="daily-bar-track">
                  <div className="daily-bar-fill" style={{ width: '100%' }} />
                </div>
                <span className="daily-hi">{day.tempMax}°</span>
              </div>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
