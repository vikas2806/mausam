import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Search, Settings, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { rankCards } from '../engine/ranking';
import { AlertBanner } from '../components/AlertBanner';
import { PersonaChip } from '../components/PersonaChip';
import { HourlyForecast, getConditionIcon } from '../components/HourlyForecast';
import { DailyForecast } from '../components/DailyForecast';
import { Skeleton } from '../components/Skeleton';
import { renderCard } from '../components/cards/CardRegistry';
import { saveProfile, getCustomPersonas } from '../utils/profileStorage';
import PERSONAS from '../config/personas.json';
import '../styles/homepage.css';

const FOR_YOU_COUNT = 4;

export function Homepage({ weatherData, profile, onOpenSettings }) {
  const { t } = useTranslation();
  const [activePersonas, setActivePersonas] = useState(profile.personas || ['health', 'commute']);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [rankedCards, setRankedCards] = useState([]);

  // Merge built-in personas with any custom ones from localStorage
  const allPersonas = [...PERSONAS, ...getCustomPersonas()];

  // Sync active personas whenever profile.personas changes (e.g. edited via SettingsModal)
  useEffect(() => {
    if (profile?.personas) {
      setActivePersonas(profile.personas);
    }
  }, [profile?.personas]);

  // Re-rank whenever activePersonas, weather data, or custom personas change
  useEffect(() => {
    const currentHour = new Date().getHours();
    const registry = [...PERSONAS, ...getCustomPersonas()];
    const ranked = rankCards(activePersonas, weatherData, currentHour, registry);
    setRankedCards(ranked);
  }, [activePersonas, weatherData, profile?.personas]);

  const togglePersona = useCallback((id) => {
    setActivePersonas(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter(p => p !== id);
      }
      return [...prev, id];
    });
  }, []);

  // Persist persona changes to localStorage
  useEffect(() => {
    saveProfile({ personas: activePersonas });
  }, [activePersonas]);

  const handleCardFeedback = (cardId, type) => {
    // Analytics stub — log to console; replace with real analytics in P8/P10
    console.log('[Analytics] Card feedback:', { cardId, type });
  };

  // Split into "For You" (top N available) and "More for you"
  const availableRanked = rankedCards.filter(r => r.isAvailable);
  const forYouCards     = availableRanked.slice(0, FOR_YOU_COUNT);
  const moreCards       = availableRanked.slice(FOR_YOU_COUNT);

  const { current, location, alerts } = weatherData;
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="homepage-header">
        <div className="header-top-row">
          <button className="header-icon-btn" aria-label="Menu">
            <Menu size={20} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div className="header-location">{location.name}</div>
            <div className="header-date">{dateStr}</div>
          </div>
          <button className="header-icon-btn" aria-label="Search">
            <Search size={20} />
          </button>
        </div>
      </header>

      {/* ── RESPONSIVE MAIN DASHBOARD CONTAINER ─────────────────────── */}
      <div className="homepage-main-container">

        {/* ── LEFT COLUMN (Hero, Alerts, Forecasts) ────────────────────── */}
        <div className="homepage-left-col">
          {/* Hero Temperature */}
          <div className="hero-temp-section glass-card">
            <div className="hero-temp-row">
              <div className="hero-condition-icon">
                {getConditionIcon(current.conditionCode)}
              </div>
              <div>
                <div>
                  <span className="hero-temp">{current.temperature}</span>
                  <span className="hero-temp-unit">°c</span>
                </div>
                <div className="hero-hi-lo">
                  <span className="hi">↑ {current.tempMax}°c</span>
                  <span className="lo">↓ {current.tempMin}°c</span>
                </div>
              </div>
            </div>
            <div className="hero-condition-row">
              <span>{current.conditionText}</span>
            </div>

            <div className="hero-stats-grid">
              <div className="hero-stat-item">
                <span className="hero-stat-label">Feels Like</span>
                <span className="hero-stat-value">{current.feelsLike}°c</span>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-label">Wind</span>
                <span className="hero-stat-value">{current.windSpeed} km/h {current.windDirection}</span>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-label">Humidity</span>
                <span className="hero-stat-value">{current.humidity}%</span>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-label">UV Index</span>
                <span className="hero-stat-value">{current.uvIndex} / 12</span>
              </div>
            </div>
          </div>

          {/* Alert Banner */}
          {alerts && alerts.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <AlertBanner alerts={alerts} />
            </div>
          )}

          {/* Hourly Forecast */}
          <div style={{ marginBottom: '16px' }}>
            <HourlyForecast hourly={weatherData.hourly} />
          </div>

          {/* Weekly Forecast */}
          <div className="section-header" style={{ padding: '0 0 10px 0' }}>
            <div className="section-title">{t('sections.weekly_forecast')}</div>
          </div>
          <DailyForecast daily={weatherData.daily} />
        </div>

        {/* ── RIGHT COLUMN (For You Cards & Persona Switcher) ──────────── */}
        <div className="homepage-right-col">
          {/* For You Section Header */}
          <div className="section-header" style={{ padding: '0 0 10px 0' }}>
            <div className="section-title">
              <Sparkles size={16} />
              {t('sections.for_you')}
            </div>
            <button
              onClick={onOpenSettings}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                opacity: 0.8
              }}
            >
              <Settings size={14} /> {t('common.edit')}
            </button>
          </div>

          {/* Cards Grid */}
          <div className="cards-grid">
            {forYouCards.length === 0 ? (
              <Skeleton height="110px" count={3} />
            ) : (
              forYouCards.map(({ cardId }) =>
                renderCard(cardId, weatherData, handleCardFeedback)
              )
            )}
          </div>

          {/* More for You Section */}
          {moreCards.length > 0 && (
            <>
              <button
                className="collapse-btn"
                onClick={() => setMoreExpanded(e => !e)}
                aria-expanded={moreExpanded}
                style={{ width: '100%', margin: '12px 0 4px 0' }}
              >
                {moreExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {moreExpanded ? t('cards.show_less') : `${t('cards.show_more')} (${moreCards.length})`}
              </button>

              {moreExpanded && (
                <div className="cards-grid" style={{ paddingTop: '8px' }}>
                  {moreCards.map(({ cardId }) =>
                    renderCard(cardId, weatherData, handleCardFeedback)
                  )}
                </div>
              )}
            </>
          )}

          <div className="section-divider" style={{ margin: '16px 0' }} />
        </div>

      </div>

      {/* ── PERSONA CHIP SWITCHER (sticky bottom bar) ──────────────────── */}
      <div className="persona-switcher-bar">
        <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: '6px' }}>
          {t('sections.active_personas')}
        </div>
        <div className="persona-chip-row">
          {/* Loop over ALL personas (built-in + custom) — no hardcoded list */}
          {allPersonas.map(persona => (
            <PersonaChip
              key={persona.id}
              id={persona.id}
              label={persona.label}
              iconName={persona.icon}
              active={activePersonas.includes(persona.id)}
              onClick={togglePersona}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
