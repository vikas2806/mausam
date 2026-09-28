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
import { saveProfile } from '../utils/profileStorage';
import '../styles/homepage.css';

const PERSONA_CHIP_DEFS = [
  { id: 'health',  labelKey: 'personas.health',  iconName: 'HeartPulse' },
  { id: 'fitness', labelKey: 'personas.fitness',  iconName: 'Activity' },
  { id: 'beach',   labelKey: 'personas.beach',    iconName: 'Waves' },
  { id: 'travel',  labelKey: 'personas.travel',   iconName: 'Plane' },
  { id: 'family',  labelKey: 'personas.family',   iconName: 'Users' },
  { id: 'agri',    labelKey: 'personas.agri',     iconName: 'Sprout' },
  { id: 'commute', labelKey: 'personas.commute',  iconName: 'Car' },
  { id: 'events',  labelKey: 'personas.events',   iconName: 'Calendar' },
];

const FOR_YOU_COUNT = 4;

export function Homepage({ weatherData, profile, onOpenSettings }) {
  const { t } = useTranslation();
  const [activePersonas, setActivePersonas] = useState(profile.personas || ['health', 'commute']);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [rankedCards, setRankedCards] = useState([]);

  // Re-rank whenever personas or weather data changes
  useEffect(() => {
    const currentHour = new Date().getHours();
    const ranked = rankCards(activePersonas, weatherData, currentHour);
    setRankedCards(ranked);
  }, [activePersonas, weatherData]);

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

      {/* ── HERO TEMPERATURE ───────────────────────────────────────────── */}
      <div className="hero-temp-section">
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
          <span style={{ opacity: 0.7 }}>💧 {current.humidity}%</span>
        </div>
        <div style={{ marginTop: '4px', fontSize: '0.82rem', opacity: 0.8 }}>
          Feels like {current.feelsLike}°c · Wind {current.windSpeed} km/h {current.windDirection}
        </div>
      </div>

      {/* ── ALERT BANNER (pinned above For You) ───────────────────────── */}
      {alerts && alerts.length > 0 && (
        <div style={{ padding: '0 16px' }}>
          <AlertBanner alerts={alerts} />
        </div>
      )}

      {/* ── HOURLY FORECAST ────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px' }}>
        <HourlyForecast hourly={weatherData.hourly} />
      </div>

      {/* ── FOR YOU SECTION ────────────────────────────────────────────── */}
      <div className="section-header">
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

      <div className="section-content">
        {forYouCards.length === 0 ? (
          <Skeleton height="110px" count={3} />
        ) : (
          forYouCards.map(({ cardId }) =>
            renderCard(cardId, weatherData, handleCardFeedback)
          )
        )}
      </div>

      {/* ── MORE FOR YOU ───────────────────────────────────────────────── */}
      {moreCards.length > 0 && (
        <>
          <button
            className="collapse-btn"
            onClick={() => setMoreExpanded(e => !e)}
            aria-expanded={moreExpanded}
          >
            {moreExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {moreExpanded ? t('cards.show_less') : `${t('cards.show_more')} (${moreCards.length})`}
          </button>

          {moreExpanded && (
            <div className="section-content" style={{ paddingTop: '8px' }}>
              {moreCards.map(({ cardId }) =>
                renderCard(cardId, weatherData, handleCardFeedback)
              )}
            </div>
          )}
        </>
      )}

      <div className="section-divider" />

      {/* ── WEEKLY FORECAST ────────────────────────────────────────────── */}
      <div className="section-header">
        <div className="section-title">{t('sections.weekly_forecast')}</div>
      </div>
      <div style={{ padding: '0 16px' }}>
        <DailyForecast daily={weatherData.daily} />
      </div>

      {/* ── PERSONA CHIP SWITCHER (sticky bottom bar) ──────────────────── */}
      <div className="persona-switcher-bar">
        <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: '6px' }}>
          {t('sections.active_personas')}
        </div>
        <div className="persona-chip-row">
          {PERSONA_CHIP_DEFS.map(chip => (
            <PersonaChip
              key={chip.id}
              id={chip.id}
              label={t(chip.labelKey)}
              iconName={chip.iconName}
              active={activePersonas.includes(chip.id)}
              onClick={togglePersona}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
