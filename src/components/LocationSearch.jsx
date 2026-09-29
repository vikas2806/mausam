import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, Navigation } from 'lucide-react';
import { searchLocations, reverseGeocode } from '../providers/geocodingProvider';

/**
 * Debounced Location Search Input component.
 * Calls searchLocations after typing stops (300ms delay) and renders matching dropdown results.
 * Includes a "Use my current location" option via navigator.geolocation.
 *
 * @param {object} props
 * @param {object} [props.selectedLocation] - Currently active location object {id, name, state, country, lat, lon, displayName}
 * @param {function} props.onSelectLocation - Callback when a location is selected from search results
 * @param {string} [props.placeholder] - Custom placeholder text
 */
export function LocationSearch({ selectedLocation, onSelectLocation, placeholder = 'Search location (e.g. Mumbai, Kochi)...' }) {
  const [query, setQuery] = useState(selectedLocation?.displayName || selectedLocation?.name || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const dropdownRef = useRef(null);

  // Sync internal query when selectedLocation prop updates
  useEffect(() => {
    if (selectedLocation) {
      setQuery(selectedLocation.displayName || selectedLocation.name || '');
    }
  }, [selectedLocation]);

  // Debounced geocoding search effect
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Skip search if query matches currently selected display name exactly
    if (selectedLocation && (trimmed === selectedLocation.displayName || trimmed === selectedLocation.name)) {
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const matches = await searchLocations(trimmed);
        setResults(matches);
        setIsOpen(true);
      } catch (err) {
        console.error('Location search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, selectedLocation]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc) => {
    setQuery(loc.displayName);
    setIsOpen(false);
    onSelectLocation(loc);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setGeoError(null);
  };

  /** Trigger browser geolocation, then reverse-geocode the coords into a location object */
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);
    setIsOpen(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const loc = await reverseGeocode(latitude, longitude);
          setQuery(loc.displayName);
          setGeoError(null);
          onSelectLocation(loc);
        } catch (err) {
          console.error('Reverse geocode error:', err);
          // Fallback: construct a minimal location from raw coords
          const fallback = {
            id: `geo_${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
            name: 'My Location',
            state: '',
            country: '',
            lat: latitude,
            lon: longitude,
            displayName: `My Location (${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E)`,
          };
          setQuery(fallback.displayName);
          setGeoError(null);
          onSelectLocation(fallback);
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Location access denied. Please allow location in browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('Location unavailable. Try again or search manually.');
            break;
          case err.TIMEOUT:
            setGeoError('Location request timed out. Try again.');
            break;
          default:
            setGeoError('Could not get location. Try again.');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const showDropdown = isOpen && (results.length > 0 || true); // always show when open for geo button

  return (
    <div className="location-search-container" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div className="location-search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary, #94a3b8)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setGeoError(null);
          }}
          onFocus={() => { setIsOpen(true); }}
          placeholder={placeholder}
          className="location-search-input"
          style={{
            width: '100%',
            padding: '10px 36px 10px 38px',
            borderRadius: '10px',
            border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
            background: 'var(--card-bg, rgba(255,255,255,0.08))',
            color: 'var(--text-primary, #fff)',
            fontSize: '0.95rem',
            outline: 'none'
          }}
        />
        {(loading || geoLoading) ? (
          <Loader2 size={16} className="spin-animation" style={{ position: 'absolute', right: '12px', color: 'var(--text-secondary, #94a3b8)' }} />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-secondary, #94a3b8)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {/* Geolocation error message */}
      {geoError && (
        <p style={{ margin: '6px 2px 0', fontSize: '0.8rem', color: 'var(--error-color, #f87171)' }}>
          {geoError}
        </p>
      )}

      {/* Results Dropdown */}
      {isOpen && (
        <ul
          className="location-search-dropdown glass-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: '280px',
            overflowY: 'auto',
            borderRadius: '12px',
            background: 'var(--bg-card, rgba(15, 23, 42, 0.95))',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            listStyle: 'none',
            margin: 0,
            padding: '6px 0'
          }}
        >
          {/* "Use my current location" — always shown at the top */}
          <li
            onClick={handleUseMyLocation}
            style={{
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: geoLoading ? 'wait' : 'pointer',
              transition: 'background 0.2s',
              color: 'var(--accent-color, #38bdf8)',
              fontSize: '0.9rem',
              borderBottom: results.length > 0 ? '1px solid var(--border-color, rgba(255,255,255,0.1))' : 'none',
              fontWeight: 500,
              opacity: geoLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!geoLoading) e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {geoLoading ? (
              <Loader2 size={16} className="spin-animation" style={{ flexShrink: 0 }} />
            ) : (
              <Navigation size={16} style={{ flexShrink: 0 }} />
            )}
            <span>{geoLoading ? 'Detecting your location…' : 'Use my current location'}</span>
          </li>

          {/* Search results */}
          {results.map((loc) => (
            <li
              key={loc.id}
              onClick={() => handleSelect(loc)}
              style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.9rem'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <MapPin size={16} style={{ color: 'var(--accent-color, #38bdf8)', flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600 }}>{loc.name}</span>
                {loc.state && <span style={{ color: 'var(--text-secondary, #94a3b8)', marginLeft: '6px' }}>({loc.state})</span>}
                {loc.country && <span style={{ color: 'var(--text-secondary, #64748b)', marginLeft: '6px' }}>• {loc.country}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
