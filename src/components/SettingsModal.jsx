import React, { useState, useEffect, useRef } from 'react';
import { LocationSearch } from './LocationSearch';
import * as Icons from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getProfile, saveProfile, resetProfile, getCustomPersonas, saveCustomPersona, deleteCustomPersona } from '../utils/profileStorage';
import { matchPersonasByQuery } from '../utils/personaMatcher';
import PERSONAS from '../config/personas.json';
import CARD_CONFIG from '../config/cardConfig.json';

const LOCATIONS = [
  { id: 'noida-01', name: 'Sector 2, Noida' },
  { id: 'mumbai-01', name: 'Marine Drive, Mumbai' },
  { id: 'chennai-01', name: 'Marina Beach, Chennai' },
  { id: 'shimla-01', name: 'Mall Road, Shimla' },
  { id: 'goa-01', name: 'Calangute, Goa' },
  { id: 'ludhiana-01', name: 'Ludhiana Agromet Belt' }
];

const ALL_CARD_IDS = Object.keys(CARD_CONFIG.cardDataRequirements);
const DEFAULT_CUSTOM_WEIGHT = 20;

export function SettingsModal({ onClose, onProfileUpdated }) {
  const { t } = useTranslation();
  const [profile, setProfileState] = useState(getProfile());
  const [customPersonas, setCustomPersonasState] = useState(getCustomPersonas());
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderLabel, setBuilderLabel] = useState('');
  const [builderCards, setBuilderCards] = useState([]);
  const [builderError, setBuilderError] = useState('');

  // Natural-language persona search state
  const [personaQuery, setPersonaQuery] = useState('');
  const [personaSuggestions, setPersonaSuggestions] = useState(null); // null = not searched yet
  const [searchError, setSearchError] = useState('');

  // All personas = built-in + custom
  const allPersonas = [...PERSONAS, ...customPersonas];

  const handlePersonaSearch = (e) => {
    e.preventDefault();
    const q = personaQuery.trim();
    if (!q) { setSearchError('Please describe yourself first.'); return; }
    setSearchError('');
    const matches = matchPersonasByQuery(q, allPersonas);
    setPersonaSuggestions(matches);
  };

  // Confirm a suggestion chip → full replacement of persona set
  const confirmSuggestion = (personaId) => {
    const nextProfile = saveProfile({ personas: [personaId] });
    setProfileState(nextProfile);
    if (onProfileUpdated) onProfileUpdated(nextProfile);
    setPersonaSuggestions(null);
    setPersonaQuery('');
  };

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

  const toggleBuilderCard = (cardId) => {
    setBuilderCards(prev =>
      prev.includes(cardId) ? prev.filter(c => c !== cardId) : [...prev, cardId]
    );
  };

  const handleSaveCustomPersona = () => {
    if (!builderLabel.trim()) { setBuilderError('Please enter a name.'); return; }
    if (builderCards.length === 0) { setBuilderError('Select at least one card.'); return; }
    setBuilderError('');

    const id = `custom-${builderLabel.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const cardWeights = {};
    builderCards.forEach(c => { cardWeights[c] = DEFAULT_CUSTOM_WEIGHT; });

    const newPersona = {
      id,
      label: builderLabel.trim(),
      icon: 'Star',
      desc: `Custom: ${builderCards.join(', ')}`,
      searchTerms: builderLabel.trim().toLowerCase().split(/\s+/).concat(builderCards),
      cards: builderCards,
      cardWeights,
      dangerRules: [],
      timeRules: []
    };

    const updated = saveCustomPersona(newPersona);
    setCustomPersonasState(updated);

    // Auto-activate it
    const nextProfile = saveProfile({ personas: [...(profile.personas || []), id] });
    setProfileState(nextProfile);
    if (onProfileUpdated) onProfileUpdated(nextProfile);

    setShowBuilder(false);
    setBuilderLabel('');
    setBuilderCards([]);
  };

  const handleDeleteCustomPersona = (personaId) => {
    const updated = deleteCustomPersona(personaId);
    setCustomPersonasState(updated);
    // Deactivate if currently active
    if ((profile.personas || []).includes(personaId)) {
      const nextProfile = saveProfile({ personas: profile.personas.filter(p => p !== personaId) });
      setProfileState(nextProfile);
      if (onProfileUpdated) onProfileUpdated(nextProfile);
    }
  };

  const handleDone = () => {
    const currentLatest = getProfile();
    if (onProfileUpdated) onProfileUpdated(currentLatest);
    onClose();
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
      <div className="settings-modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Settings & Preferences</h3>
          <button onClick={handleDone} className="tap-target" style={{ width: '32px', height: '32px' }}>
            <Icons.X size={20} />
          </button>
        </div>

        {/* Location Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '6px' }}>
            Active Location (Search City / District)
          </label>
          <LocationSearch
            selectedLocation={profile.location}
            onSelectLocation={(loc) => {
              const nextProfile = saveProfile({ locationId: loc.id, location: loc });
              setProfileState(nextProfile);
              if (onProfileUpdated) onProfileUpdated(nextProfile);
            }}
          />
        </div>

        {/* Active Personas — loops over personas.json + custom, no hardcoded list */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
            Active Personas
          </label>

          {/* Natural-language search */}
          <form onSubmit={handlePersonaSearch} style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <input
              type="text"
              value={personaQuery}
              onChange={e => { setPersonaQuery(e.target.value); setPersonaSuggestions(null); setSearchError(''); }}
              placeholder="e.g. 'I run every morning' or 'I love the beach'"
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '0.78rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icons.Search size={13} />
            </button>
          </form>

          {searchError && (
            <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginBottom: '8px' }}>{searchError}</div>
          )}

          {/* Suggestion chips (replaces full persona set on confirm) */}
          {personaSuggestions !== null && (
            <div style={{ marginBottom: '10px' }}>
              {personaSuggestions.length > 0 ? (
                <>
                  <div style={{ fontSize: '0.72rem', opacity: 0.7, marginBottom: '6px' }}>
                    Best matches — tap to switch:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {personaSuggestions.slice(0, 4).map(p => {
                      const IconComp = Icons[p.icon] || Icons.User;
                      return (
                        <button
                          key={p.id}
                          onClick={() => confirmSuggestion(p.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.4)',
                            background: 'rgba(255,255,255,0.12)',
                            color: '#fff',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          <IconComp size={12} />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '6px' }}>
                  No strong match found — pick from the list below or build your own.
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: '0.72rem', opacity: 0.6, marginBottom: '6px' }}>
            Or toggle manually (multi-select):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>

            {allPersonas.map((persona) => {
              const isActive = (profile.personas || []).includes(persona.id);
              const isCustom = customPersonas.some(cp => cp.id === persona.id);
              return (
                <div key={persona.id} style={{ position: 'relative' }}>
                  <button
                    onClick={() => togglePersona(persona.id)}
                    style={{
                      width: '100%',
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isCustom && <Icons.Star size={10} style={{ opacity: 0.7 }} />}
                      {persona.label}
                    </span>
                    {isActive && <Icons.Check size={14} />}
                  </button>
                  {isCustom && (
                    <button
                      onClick={() => handleDeleteCustomPersona(persona.id)}
                      title="Delete custom persona"
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'rgba(229,57,53,0.85)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1
                      }}
                    >×</button>
                  )}
                </div>
              );
            })}

            {/* Build your own button */}
            <button
              onClick={() => setShowBuilder(true)}
              style={{
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px dashed rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.04)',
                color: '#ffffff',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Icons.Plus size={12} /> Build your own
            </button>
          </div>
        </div>

        {/* Inline "Build your own" persona builder */}
        {showBuilder && (
          <div className="glass-card" style={{ padding: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>New Custom Persona</span>
              <button onClick={() => setShowBuilder(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <Icons.X size={14} />
              </button>
            </div>

            <input
              type="text"
              value={builderLabel}
              onChange={e => setBuilderLabel(e.target.value)}
              placeholder="Persona name..."
              maxLength={40}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '0.8rem',
                outline: 'none',
                marginBottom: '10px'
              }}
            />

            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '6px' }}>Select cards:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {ALL_CARD_IDS.map(cardId => {
                const chosen = builderCards.includes(cardId);
                return (
                  <button
                    key={cardId}
                    type="button"
                    onClick={() => toggleBuilderCard(cardId)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: chosen ? '#ffffff' : 'rgba(255,255,255,0.15)',
                      background: chosen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.04)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {cardId}
                  </button>
                );
              })}
            </div>

            {builderError && <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '6px' }}>{builderError}</div>}

            <button
              onClick={handleSaveCustomPersona}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '8px',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#004b93',
                fontWeight: 700,
                fontSize: '0.8rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Save Custom Persona
            </button>
          </div>
        )}

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
            <Icons.RefreshCw size={14} /> Re-run Onboarding
          </button>

          <button
            onClick={handleDone}
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
