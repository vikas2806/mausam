import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MockWeatherProvider } from './data/MockWeatherProvider';

const provider = new MockWeatherProvider();

export default function App() {
  const { t, i18n } = useTranslation();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await provider.getWeatherData('noida-01');
      setWeatherData(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
  };

  return (
    <div className="app-viewport">
      <header style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{t('app.title')}</h1>
          <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>{t('app.subtitle')}</p>
        </div>
        <button className="tap-target" onClick={toggleLanguage} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '16px', padding: '4px 12px' }}>
          {i18n.language.toUpperCase()}
        </button>
      </header>

      <main style={{ padding: '16px', flex: 1 }}>
        {loading ? (
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>Loading weather foundation...</div>
        ) : (
          <div className="glass-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{weatherData.location.name}</h2>
            <div style={{ fontSize: '3.5rem', fontWeight: 300 }}>{weatherData.current.temperature}°c</div>
            <p style={{ marginTop: '8px', opacity: 0.9 }}>{weatherData.current.conditionText}</p>
            <div style={{ marginTop: '12px', fontSize: '0.85rem', display: 'flex', gap: '12px' }}>
              <span>AQI: {weatherData.airQuality?.aqi} ({weatherData.airQuality?.category})</span>
              <span>Humidity: {weatherData.current.humidity}%</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
