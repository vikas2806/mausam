import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Info } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { useTranslation } from 'react-i18next';

export function WeatherCard({
  cardId,
  title,
  icon: IconComponent,
  value,
  unit = '',
  badgeText,
  badgeSeverity = 'Green',
  insight,
  isUnavailable = false,
  fallbackMessage,
  onFeedback
}) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (cardId) {
      const stored = localStorage.getItem(`feedback_${cardId}`);
      if (stored) setFeedback(stored);
    }
  }, [cardId]);

  const handleFeedback = (type) => {
    const nextFeedback = feedback === type ? null : type;
    setFeedback(nextFeedback);
    if (cardId) {
      if (nextFeedback) {
        localStorage.setItem(`feedback_${cardId}`, nextFeedback);
      } else {
        localStorage.removeItem(`feedback_${cardId}`);
      }
    }
    if (onFeedback) {
      onFeedback(cardId, nextFeedback);
    }
  };

  if (isUnavailable) {
    return (
      <div className="glass-card weather-card">
        <EmptyState
          title={title}
          message={fallbackMessage || t('cards.not_available')}
        />
      </div>
    );
  }

  return (
    <div className="glass-card weather-card" data-testid={`weather-card-${cardId}`}>
      <div className="weather-card-header">
        <div className="weather-card-title">
          {IconComponent && <IconComponent size={18} />}
          <span>{title}</span>
        </div>
        {badgeText && (
          <span className={`severity-badge ${badgeSeverity}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className="weather-card-body">
        <div>
          <span className="weather-card-value">{value}</span>
          {unit && <span className="weather-card-unit">{unit}</span>}
        </div>
      </div>

      {insight && (
        <div className="weather-card-insight">
          <p>{insight}</p>
        </div>
      )}

      <div className="card-feedback-bar">
        <span>{t('cards.was_helpful')}</span>
        <div className="feedback-btn-group">
          <button
            type="button"
            aria-label="Thumbs Up"
            className={`feedback-btn ${feedback === 'up' ? 'active' : ''}`}
            onClick={() => handleFeedback('up')}
          >
            <ThumbsUp size={12} />
          </button>
          <button
            type="button"
            aria-label="Thumbs Down"
            className={`feedback-btn ${feedback === 'down' ? 'active' : ''}`}
            onClick={() => handleFeedback('down')}
          >
            <ThumbsDown size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
