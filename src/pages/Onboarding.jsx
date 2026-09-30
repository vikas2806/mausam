import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { LocationSearch } from '../components/LocationSearch';
import { saveProfile, setOnboardingCompleted, DEFAULT_LOCATION } from '../utils/profileStorage';
import PERSONAS from '../config/personas.json';
import CARD_CONFIG from '../config/cardConfig.json';

import { matchPersonasByQuery } from '../utils/personaMatcher';

const MOCK_LOCATIONS = [
  { id: 'noida-01', name: 'Sector 2, Noida (Delhi NCR)' },
  { id: 'mumbai-01', name: 'Marine Drive, Mumbai' },
  { id: 'chennai-01', name: 'Marina Beach, Chennai' },
  { id: 'shimla-01', name: 'Mall Road, Shimla' },
  { id: 'goa-01', name: 'Calangute, Goa' },
  { id: 'ludhiana-01', name: 'Ludhiana Agricultural District, Punjab' }
];

// All card IDs known to the system (from cardDataRequirements keys)
const ALL_CARD_IDS = Object.keys(CARD_CONFIG.cardDataRequirements);

// Default weights for "Build your own" persona — equal weighting
const DEFAULT_CUSTOM_WEIGHT = 20;

export function Onboarding({ onComplete }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedPersonas, setSelectedPersonas] = useState(['health', 'commute']);
  const [locationId, setLocationId] = useState('noida-01');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [healthInputs, setHealthInputs] = useState({
    respiratorySensitivity: false,
    outdoorRunner: false,
    dailyCommuter: true
  });

  const matchedSuggestions = matchPersonasByQuery(searchQuery, PERSONAS);

  // "Build your own" persona state
  const [showBuildOwn, setShowBuildOwn] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customCards, setCustomCards] = useState([]);
  const [buildError, setBuildError] = useState('');

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

  const toggleCustomCard = (cardId) => {
    setCustomCards(prev =>
      prev.includes(cardId) ? prev.filter(c => c !== cardId) : [...prev, cardId]
    );
  };

  const handleSaveCustomPersona = () => {
    if (!customLabel.trim()) { setBuildError('Please enter a name.'); return; }
    if (customCards.length === 0) { setBuildError('Select at least one card.'); return; }
    setBuildError('');

    const id = `custom-${customLabel.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const cardWeights = {};
    customCards.forEach(c => { cardWeights[c] = DEFAULT_CUSTOM_WEIGHT; });

    const customPersona = {
      id,
      label: customLabel.trim(),
      icon: 'Star',
      desc: `Custom: ${customCards.join(', ')}`,
      searchTerms: customLabel.trim().toLowerCase().split(/\s+/).concat(customCards),
      cards: customCards,
      cardWeights,
      dangerRules: [],
      timeRules: []
    };

    // Save to localStorage via profileStorage
    import('../utils/profileStorage').then(({ saveCustomPersona }) => {
      saveCustomPersona(customPersona);
    });

    // Auto-select the new persona
    setSelectedPersonas(prev => [...prev, id]);
    setShowBuildOwn(false);
    setCustomLabel('');
    setCustomCards([]);
  };

  const handleFinish = () => {
    saveProfile({
      personas: selectedPersonas,
      locationId: selectedLocation?.id || locationId,
      location: selectedLocation || DEFAULT_LOCATION,
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
          <Icons.ShieldCheck size={14} />
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

      {step === 2 && !showBuildOwn && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '12px 0' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
            Choose Your Personas
          </h3>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '12px' }}>
            Select one or multiple profiles (multi-select supported):
          </p>

          {/* Natural language persona description / search input */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Describe yourself (e.g. "I'm a beach person" or "I run every morning"):
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type how you live, work, or move..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.18)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.35)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <Icons.Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }} />
            </div>
          </div>

          {/* Suggested persona chips based on keyword match (requires user tap to confirm) */}
          {matchedSuggestions.length > 0 && (
            <div style={{ marginBottom: '14px', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Matching Persona Suggestions (Tap chip to confirm):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {matchedSuggestions.map(persona => {
                  const isSelected = selectedPersonas.includes(persona.id);
                  const IconComp = Icons[persona.icon] || Icons.User;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => togglePersona(persona.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        border: '1px solid',
                        borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.3)',
                        background: isSelected ? '#ffffff' : 'rgba(255,255,255,0.2)',
                        color: isSelected ? '#004b93' : '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <IconComp size={14} />
                      <span>{persona.label}</span>
                      {isSelected ? <Icons.Check size={14} /> : <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>(Confirm)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loop over personas.json — no hardcoded list */}
          <div className="onboarding-persona-grid">
            {PERSONAS.map((persona) => {
              const IconComp = Icons[persona.icon] || Icons.User;
              const isSelected = selectedPersonas.includes(persona.id);
              return (
                <div
                  key={persona.id}
                  onClick={() => togglePersona(persona.id)}
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
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{persona.label}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>{persona.desc}</div>
                  </div>
                  {isSelected && <Icons.CheckCircle size={20} color="#ffffff" />}
                </div>
              );
            })}

            {/* "Build your own" option */}
            <div
              onClick={() => setShowBuildOwn(true)}
              className="glass-card"
              style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.07)',
                borderColor: 'rgba(255,255,255,0.3)',
                borderStyle: 'dashed'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icons.Plus size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Build Your Own Persona</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                  Pick any cards from the library and create a custom profile
                </div>
              </div>
            </div>
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

      {/* "Build your own" panel */}
      {step === 2 && showBuildOwn && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setShowBuildOwn(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
            >
              <Icons.ArrowLeft size={20} />
            </button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Build Your Own Persona</h3>
          </div>

          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Persona Name
          </label>
          <input
            type="text"
            value={customLabel}
            onChange={e => setCustomLabel(e.target.value)}
            placeholder="e.g. Night Owl, Cyclist..."
            maxLength={40}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              fontSize: '0.9rem',
              outline: 'none',
              marginBottom: '16px'
            }}
          />

          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Select Cards ({customCards.length} chosen)
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            overflowY: 'auto',
            flex: 1,
            paddingBottom: '4px'
          }}>
            {ALL_CARD_IDS.map(cardId => {
              const isChosen = customCards.includes(cardId);
              return (
                <button
                  key={cardId}
                  type="button"
                  onClick={() => toggleCustomCard(cardId)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: isChosen ? '#ffffff' : 'rgba(255,255,255,0.2)',
                    background: isChosen ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: isChosen ? 700 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left'
                  }}
                >
                  <span>{cardId}</span>
                  {isChosen && <Icons.Check size={12} />}
                </button>
              );
            })}
          </div>

          {buildError && (
            <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '8px' }}>{buildError}</div>
          )}

          <button
            type="button"
            onClick={handleSaveCustomPersona}
            style={{
              marginTop: '12px',
              width: '100%',
              background: '#ffffff',
              color: '#004b93',
              fontWeight: 700,
              borderRadius: '16px',
              padding: '12px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Save Persona & Add to Selection
          </button>
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
              <Icons.MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Primary City / District (Search)
            </label>
            <LocationSearch
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => {
                setSelectedLocation(loc);
                setLocationId(loc.id);
              }}
            />
          </div>

          <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.Info size={14} /> Optional Health Inputs
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
