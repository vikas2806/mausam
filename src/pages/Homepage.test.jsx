import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Homepage } from './Homepage';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'sections.for_you': 'For You',
        'sections.active_personas': 'Active Personas',
        'sections.weekly_forecast': 'Weekly Forecast',
        'common.edit': 'Edit',
        'cards.show_more': 'Show More',
        'cards.show_less': 'Show Less'
      };
      return map[key] || key;
    }
  })
}));

const mockWeatherData = {
  location: { id: 'mumbai-01', name: 'Marine Drive, Mumbai', state: 'Maharashtra', isCoastal: true, isAgriRegion: false },
  current: {
    temperature: 28,
    feelsLike: 29,
    tempMin: 22,
    tempMax: 32,
    humidity: 65,
    windSpeed: 12,
    windDirection: 'NW',
    conditionText: 'Clear Sky',
    conditionCode: 'sunny',
    uvIndex: 8,
    visibility: 9.0,
    pressure: 1012,
    sunrise: '06:15 AM',
    sunset: '06:45 PM'
  },
  hourly: [
    { timestamp: '06:00 AM', temperature: 24, humidity: 70, rainProbability: 10, conditionText: 'Clear', icon: 'sun' }
  ],
  daily: [
    { date: '9/30', dayName: 'Today', tempMin: 22, tempMax: 32, conditionText: 'Clear', rainProbability: 10, icon: 'sun' }
  ],
  airQuality: { aqi: 45, pm25: 12, pm10: 25, category: 'Good', pollenCount: 15 },
  marine: {
    waveHeight: 1.5,
    waterTemp: 27,
    tideHighTime: '10:00 AM',
    tideLowTime: '04:00 PM',
    seaCondition: 'Moderate'
  },
  agri: null,
  alerts: []
};

describe('Homepage Persona Dynamic Re-ranking', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
  });

  it('renders cards according to initial active persona', () => {
    const profile = { personas: ['fitness'], locationId: 'mumbai-01' };
    render(<Homepage weatherData={mockWeatherData} profile={profile} onOpenSettings={vi.fn()} />);

    // Fitness persona prioritizes bestRunningHours and uvIndex
    expect(screen.getByText('Best Running Window')).toBeDefined();
    expect(screen.getAllByText('UV Index').length).toBeGreaterThan(0);
  });

  it('dynamically re-ranks and updates cards when profile.personas changes via Settings edit', () => {
    const profile1 = { personas: ['fitness'], locationId: 'mumbai-01' };
    const { rerender } = render(<Homepage weatherData={mockWeatherData} profile={profile1} onOpenSettings={vi.fn()} />);

    expect(screen.getByText('Best Running Window')).toBeDefined();

    // User switches to Beachgoers persona in Settings modal
    const profile2 = { personas: ['beach'], locationId: 'mumbai-01' };
    rerender(<Homepage weatherData={mockWeatherData} profile={profile2} onOpenSettings={vi.fn()} />);

    // Beach persona prioritizes marine cards (Sea Wave Height) and UV index
    expect(screen.getByText('Sea Wave Height')).toBeDefined();
    expect(screen.getAllByText('UV Index').length).toBeGreaterThan(0);
  });

  it('updates cards when persona chips on homepage are toggled', () => {
    const profile = { personas: ['fitness'], locationId: 'mumbai-01' };
    render(<Homepage weatherData={mockWeatherData} profile={profile} onOpenSettings={vi.fn()} />);

    // Find and click the Beach chip in the switcher bar
    const beachChip = screen.getByText('Beachgoers & Swimmers');
    fireEvent.click(beachChip);

    // Both fitness and beach cards should now be prioritized
    expect(screen.getByText('Sea Wave Height')).toBeDefined();
  });
});
