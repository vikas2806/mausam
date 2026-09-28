import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, SlidersHorizontal } from 'lucide-react';
import { MockWeatherProvider } from './data/MockWeatherProvider';
import { DevComponentsPreview } from './pages/DevComponentsPreview';
import { Onboarding } from './pages/Onboarding';
import { SettingsModal } from './components/SettingsModal';
import { getProfile, hasCompletedOnboarding } from './utils/profileStorage';
import './styles/components.css';

const provider = new MockWeatherProvider();

export default function App() {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState(getProfile());
  const [completedOnboarding, setCompletedOnboarding] = useState(hasCompletedOnboarding());
  const [showSettings, setShowSettings] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewDevPreview, setViewDevPreview] = useState(
    window.location.pathname === '/dev/components' || window.location.search.includes('dev=true')
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await provider.getWeatherData(profile.locationId);
      setWeatherData(data);
      setLoading(false);
    }
    if (completedOnboarding) {
      loadData();
    }
  }, [profile.locationId, completedOnboarding]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
  };

  const handleOnboardingComplete = () => {
    setProfile(getProfile());
    setCompletedOnboarding(true);
  };

  if (!completedOnboarding && !viewDevPreview) {
    return (
      <div className="app-viewport">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  if (viewDevPreview) {
    return (
      <div className="app-viewport">
        <DevComponentsPreview onBack={() => setViewDevPreview(false)} />
      </div>
    );
  }

  return (
    <div className="app-viewport">
      <header style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{t('app.title')}</h1>
          <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>{t('app.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            className="tap-target"
            onClick={() => setViewDevPreview(true)}
            style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '4px 10px', fontSize: '0.725rem' }}
          >
            /dev/components
          </button>
          <button
            className="tap-target"
            onClick={toggleLanguage}
            style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '16px', padding: '4px 10px', fontSize: '0.725rem' }}
          >
            {i18n.language.toUpperCase()}
          </button>
          <button
            className="tap-target"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main style={{ padding: '16px', flex: 1 }}>
        {loading ? (
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>Loading location weather...</div>
        ) : (
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{weatherData.location.name}</h2>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{weatherData.location.state}</span>
              </div>
              <button
                className="feedback-btn"
                onClick={() => setShowSettings(true)}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                <SlidersHorizontal size={12} /> {profile.personas?.length || 0} Personas
              </button>
            </div>

            <div style={{ fontSize: '3.5rem', fontWeight: 300, marginTop: '12px' }}>
              {weatherData.current.temperature}°c
            </div>
            <p style={{ marginTop: '4px', opacity: 0.9 }}>{weatherData.current.conditionText}</p>
            <div style={{ marginTop: '14px', fontSize: '0.85rem', display: 'flex', gap: '12px' }}>
              <span>AQI: {weatherData.airQuality?.aqi} ({weatherData.airQuality?.category})</span>
              <span>Humidity: {weatherData.current.humidity}%</span>
            </div>
          </div>
        )}
      </main>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onProfileUpdated={(next) => setProfile(next)}
        />
      )}
    </div>
  );
}
