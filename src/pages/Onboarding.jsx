import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HeartPulse, Activity, Waves, Plane, Users, Sprout, Car, Calendar,
  MapPin, CheckCircle, ArrowRight, ShieldCheck, Info
} from 'lucide-react';
import { saveProfile, setOnboardingCompleted } from '../utils/profileStorage';

const PERSONA_OPTIONS = [
  { id: 'health', icon: HeartPulse, labelKey: 'personas.health', desc: 'AQI alerts, pollen count, UV index, humidity insights' },
  { id: 'fitness', icon: Activity, labelKey: 'personas.fitness', desc: 'Best running hours, wind speed, sunrise & heat index' },
  { id: 'beach', icon: Waves, labelKey: 'personas.beach', desc: 'Sea swell height, tide timings, water temperature' },
  { id: 'travel', icon: Plane, labelKey: 'personas.travel', desc: 'Destination alerts, flight weather, packing advice' },
  { id: 'family', icon: Users, labelKey: 'personas.family', desc: 'School commute weather, severe rain & storm warnings' },
  { id: 'agri', icon: Sprout, labelKey: 'personas.agri', desc: 'Soil moisture, frost hazards, crop planting guidance' },
  { id: 'commute', icon: Car, labelKey: 'personas.commute', desc: 'Fog visibility, traffic risk, storm alerts, leave-by tips' },
  { id: 'events', icon: Calendar, labelKey: 'personas.events', desc: 'Extended 7-day forecast, rain chance, outdoor comfort' }
];

const MOCK_LOCATIONS = [
  { id: 'noida-01', name: 'Sector 2, Noida (Delhi NCR)' },
  { id: 'mumbai-01', name: 'Marine Drive, Mumbai' },
  { id: 'chennai-01', name: 'Marina Beach, Chennai' },
  { id: 'shimla-01', name: 'Mall Road, Shimla' },
  { id: 'goa-01', name: 'Calangute, Goa' },
  { id: 'ludhiana-01', name: 'Ludhiana Agricultural District, Punjab' }
];

export function Onboarding({ onComplete }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedPersonas, setSelectedPersonas] = useState(['health', 'commute']);
  const [locationId, setLocationId] = useState('noida-01');
  const [healthInputs, setHealthInputs] = useState({
    respiratorySensitivity: false,
    outdoorRunner: false,
    dailyCommuter: true
  });

  const togglePersona = (id) => {
    if (selectedPersonas.includes(id)) {
      if (selectedPersonas.length > 1) {
        setSelectedPersonas(selectedPersonas.filter(p => p !== id));
      }
    } else {
      setSelectedPersonas([...selectedPersonas, id]);
    }
  };

  const toggleHealthInput = (key) => {
    setHealthInputs({ ...healthInputs, [key]: !healthInputs[key] });
  };

  const handleFinish = () => {
    saveProfile({
      personas: selectedPersonas,
      locationId,
      healthInputs
    });
    setOnboardingCompleted(true);
    if (onComplete) onComplete();
  };

  return (
    <div className="onboarding-container">
      {/* Header Badge */}
      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.15)',
          padding: '6px 14px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          <ShieldCheck size={14} />
          <span>IMD Mausam Personalization</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <div style={{ textAlign: 'center', margin: 'auto 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌤️</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>
            Welcome to Mausam
          </h2>
          <p style={{ fontSize: '0.9rem', opacity: 0.85, lineHeight: 1.5, marginBottom: '24px' }}>
            Experience weather that reshapes itself around your lifestyle. Select your personas to get custom insights, timing advice, and severe alerts.
          </p>
          <button
            type="button"
            className="tap-target"
            onClick={() => setStep(2)}
            style={{
              width: '100%',
              background: '#ffffff',
              color: '#004b93',
              fontWeight: 700,
              borderRadius: '16px',
              padding: '14px',
              fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}
          >
            Get Started
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '12px 0' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
            Choose Your Personas
          </h3>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '12px' }}>
            Select one or multiple profiles (multi-select supported):
          </p>

          <div className="onboarding-persona-grid">
            {PERSONA_OPTIONS.map((item) => {
              const IconComp = item.icon;
              const isSelected = selectedPersonas.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => togglePersona(item.id)}
                  className="glass-card"
                  style={{
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.12)',
                    borderColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: isSelected ? '#ffffff' : 'rgba(255,255,255,0.15)',
                    color: isSelected ? '#004b93' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconComp size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t(item.labelKey)}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>{item.desc}</div>
                  </div>
                  {isSelected && <CheckCircle size={20} color="#ffffff" />}
                </div>
              );
            })}
          </div>

          <div style={{ paddingTop: '12px' }}>
            <button
              type="button"
              className="tap-target"
              onClick={() => setStep(3)}
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#004b93',
                fontWeight: 700,
                borderRadius: '16px',
                padding: '14px',
                fontSize: '0.95rem'
              }}
            >
              Continue ({selectedPersonas.length} Selected)
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ margin: 'auto 0' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
            Location & Preferences
          </h3>
          <p style={{ fontSize: '0.825rem', opacity: 0.8, marginBottom: '16px' }}>
            Set your primary weather station location and optional health filters:
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Primary City / District
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.4)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              {MOCK_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id} style={{ background: '#121820', color: '#ffffff' }}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} /> Optional Health Inputs
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>Respiratory Sensitivity (Asthma / Dust)</span>
                <input
                  type="checkbox"
                  checked={healthInputs.respiratorySensitivity}
                  onChange={() => toggleHealthInput('respiratorySensitivity')}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>Daily Outdoor Runner / Athlete</span>
                <input
                  type="checkbox"
                  checked={healthInputs.outdoorRunner}
                  onChange={() => toggleHealthInput('outdoorRunner')}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            className="tap-target"
            onClick={handleFinish}
            style={{
              width: '100%',
              background: '#ffffff',
              color: '#004b93',
              fontWeight: 700,
              borderRadius: '16px',
              padding: '14px',
              fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}
          >
            Save & Open Homepage ✨
          </button>
        </div>
      )}
    </div>
  );
}
