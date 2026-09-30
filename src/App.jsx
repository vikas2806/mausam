import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getWeatherProvider } from './providers/factory';
import { DevComponentsPreview } from './pages/DevComponentsPreview';
import { Onboarding } from './pages/Onboarding';
import { Homepage } from './pages/Homepage';
import { SettingsModal } from './components/SettingsModal';
import { Skeleton } from './components/Skeleton';
import { getProfile, hasCompletedOnboarding } from './utils/profileStorage';
import './styles/components.css';

export default function App() {
  const { i18n } = useTranslation();
  const [profile, setProfile] = useState(getProfile());
  const [completedOnboarding, setCompletedOnboarding] = useState(hasCompletedOnboarding());
  const [showSettings, setShowSettings] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isDevPreview = window.location.pathname === '/dev/components'
    || window.location.search.includes('dev=true');

  useEffect(() => {
    if (!completedOnboarding) return;
    setLoading(true);
    const provider = getWeatherProvider();
    const locParam = profile.location || profile.locationId;
    provider.getWeatherData(locParam)
      .then(data => {
        setWeatherData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('[App] Failed to fetch weather data:', err);
        setLoading(false);
      });
  }, [profile.location?.id, profile.location?.lat, profile.location?.lon, profile.locationId, completedOnboarding]);

  const handleOnboardingComplete = () => {
    setProfile(getProfile());
    setCompletedOnboarding(true);
  };

  const handleProfileUpdated = (next) => {
    setProfile(next);
  };

  // ── Dev preview route ─────────────────────────────────────────────────────
  if (isDevPreview) {
    return (
      <div className="app-viewport">
        <DevComponentsPreview onBack={() => window.history.back()} />
      </div>
    );
  }

  // ── First-time onboarding ────────────────────────────────────────────────
  if (!completedOnboarding) {
    return (
      <div className="app-viewport">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // ── Main app ─────────────────────────────────────────────────────────────
  return (
    <div className="app-viewport">
      {loading || !weatherData ? (
        <div style={{ padding: '16px' }}>
          <Skeleton height="100px" count={4} />
        </div>
      ) : (
        <Homepage
          weatherData={weatherData}
          profile={profile}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
}
