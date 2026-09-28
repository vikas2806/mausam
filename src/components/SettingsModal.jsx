import React, { useState } from 'react';
import { X, Check, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getProfile, saveProfile, resetProfile } from '../utils/profileStorage';

const PERSONAS = [
  { id: 'health', labelKey: 'personas.health' },
  { id: 'fitness', labelKey: 'personas.fitness' },
  { id: 'beach', labelKey: 'personas.beach' },
  { id: 'travel', labelKey: 'personas.travel' },
  { id: 'family', labelKey: 'personas.family' },
  { id: 'agri', labelKey: 'personas.agri' },
  { id: 'commute', labelKey: 'personas.commute' },
  { id: 'events', labelKey: 'personas.events' }
];

const LOCATIONS = [
  { id: 'noida-01', name: 'Sector 2, Noida' },
  { id: 'mumbai-01', name: 'Marine Drive, Mumbai' },
  { id: 'chennai-01', name: 'Marina Beach, Chennai' },
  { id: 'shimla-01', name: 'Mall Road, Shimla' },
  { id: 'goa-01', name: 'Calangute, Goa' },
  { id: 'ludhiana-01', name: 'Ludhiana Agromet Belt' }
];

export function SettingsModal({ onClose, onProfileUpdated }) {
  const { t } = useTranslation();
  const [profile, setProfileState] = useState(getProfile());

  const togglePersona = (id) => {
    const current = profile.personas || [];
    let updated;
    if (current.includes(id)) {
      if (current.length === 1) return;
      updated = current.filter(p => p !== id);
    } else {
      updated = [...current, id];
    }
    const nextProfile = saveProfile({ personas: updated });
    setProfileState(nextProfile);
    if (onProfileUpdated) onProfileUpdated(nextProfile);
  };

  const changeLocation = (locationId) => {
    const nextProfile = saveProfile({ locationId });
    setProfileState(nextProfile);
    if (onProfileUpdated) onProfileUpdated(nextProfile);
  };

  const handleReset = () => {
    resetProfile();
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '360px',
        padding: '20px',
        background: '#1c2431',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Settings & Preferences</h3>
          <button onClick={onClose} className="tap-target" style={{ width: '32px', height: '32px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Location Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '6px' }}>
            Active Location
          </label>
          <select
            value={profile.locationId}
            onChange={(e) => changeLocation(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.85rem'
            }}
          >
            {LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id} style={{ background: '#1c2431', color: '#ffffff' }}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Active Personas */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
            Active Personas (Multi-Select)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {PERSONAS.map((p) => {
              const isActive = (profile.personas || []).includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePersona(p.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: isActive ? '#ffffff' : 'rgba(255,255,255,0.15)',
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.05)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <span>{t(p.labelKey)}</span>
                  {isActive && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset Button */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-alert-red)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Re-run Onboarding
          </button>

          <button
            onClick={onClose}
            className="feedback-btn"
            style={{ padding: '6px 14px', fontWeight: 600 }}
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
