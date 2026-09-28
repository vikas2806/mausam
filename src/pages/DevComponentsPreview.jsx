import React, { useState } from 'react';
import { WeatherCard } from '../components/WeatherCard';
import { AlertBanner } from '../components/AlertBanner';
import { PersonaChip } from '../components/PersonaChip';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Activity, ShieldAlert, Sun, Wind, Flame, Waves } from 'lucide-react';
import '../styles/components.css';

export function DevComponentsPreview({ onBack }) {
  const [activePersona, setActivePersona] = useState('health');

  const sampleAlerts = [
    {
      id: 'alert-preview-1',
      title: 'Dense Fog Warning (IMD Orange Alert)',
      description: 'Visibility drops below 200m during 06:00 - 09:30 AM. Exercise caution during commute.',
      severity: 'Orange',
      issuedAt: '2026-09-28T05:00:00Z',
      validUntil: '2026-09-29T11:00:00Z'
    },
    {
      id: 'alert-preview-2',
      title: 'Cyclone Storm Warning (IMD Red Alert)',
      description: 'Gale wind speed reaching 80-90 kmph along coast. Heavy downpour expected.',
      severity: 'Red',
      issuedAt: '2026-09-28T06:00:00Z',
      validUntil: '2026-09-29T18:00:00Z'
    }
  ];

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem' }}>UI Kit Component Preview</h2>
        {onBack && (
          <button onClick={onBack} className="feedback-btn" style={{ padding: '6px 12px' }}>
            ← Back to App
          </button>
        )}
      </header>

      {/* 1. Alert Banners */}
      <section>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', opacity: 0.8 }}>1. Pinned Alert Banners (Red & Orange)</h3>
        <AlertBanner alerts={[sampleAlerts[1]]} />
        <AlertBanner alerts={[sampleAlerts[0]]} />
      </section>

      {/* 2. Persona Chips Row */}
      <section>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', opacity: 0.8 }}>2. Persona Chips Row</h3>
        <div className="persona-chip-row">
          <PersonaChip id="health" label="Health" iconName="HeartPulse" active={activePersona === 'health'} onClick={setActivePersona} />
          <PersonaChip id="fitness" label="Outdoor Fitness" iconName="Activity" active={activePersona === 'fitness'} onClick={setActivePersona} />
          <PersonaChip id="beach" label="Beachgoers" iconName="Waves" active={activePersona === 'beach'} onClick={setActivePersona} />
          <PersonaChip id="travel" label="Travelers" iconName="Plane" active={activePersona === 'travel'} onClick={setActivePersona} />
        </div>
      </section>

      {/* 3. Weather Cards */}
      <section>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', opacity: 0.8 }}>3. Weather Cards (With Badges & Feedback)</h3>
        <WeatherCard
          cardId="aqi-card-demo"
          title="Air Quality Index (AQI)"
          icon={Activity}
          value={185}
          unit="AQI"
          badgeText="Severe / Poor"
          badgeSeverity="Red"
          insight="High PM2.5 levels detected. Sensitive individuals should wear an N95 mask outdoors."
        />

        <WeatherCard
          cardId="uv-card-demo"
          title="UV Index"
          icon={Sun}
          value={8}
          unit="/ 12"
          badgeText="Very High"
          badgeSeverity="Orange"
          insight="Peak radiation between 11:30 AM and 03:00 PM. Apply SPF 30+ sunscreen."
        />

        <WeatherCard
          cardId="marine-card-demo"
          title="Sea Wave Height"
          icon={Waves}
          value={1.8}
          unit="meters"
          badgeText="Moderate Swell"
          badgeSeverity="Yellow"
          insight="High tide expected at 11:45 AM. Swimmers stay cautious."
        />
      </section>

      {/* 4. Degraded Card / Empty State */}
      <section>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', opacity: 0.8 }}>4. Degraded / Missing Data Card</h3>
        <WeatherCard
          cardId="missing-card-demo"
          title="Soil Moisture & Agri Insights"
          isUnavailable={true}
          fallbackMessage="Soil moisture sensors are unavailable for urban location Noida."
        />
      </section>

      {/* 5. Skeleton Loader */}
      <section>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', opacity: 0.8 }}>5. Loading Skeletons</h3>
        <Skeleton height="100px" count={2} />
      </section>
    </div>
  );
}
