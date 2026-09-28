import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { WeatherCard } from './WeatherCard';
import { Activity } from 'lucide-react';
import '../i18n';

describe('WeatherCard Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders card title, value, unit, and badge correctly', () => {
    render(
      <WeatherCard
        cardId="test-aqi"
        title="Air Quality"
        icon={Activity}
        value={185}
        unit="AQI"
        badgeText="Poor"
        badgeSeverity="Red"
        insight="Wear a mask outdoors."
      />
    );

    expect(screen.getByText('Air Quality')).toBeDefined();
    expect(screen.getByText('185')).toBeDefined();
    expect(screen.getByText('AQI')).toBeDefined();
    expect(screen.getByText('Poor')).toBeDefined();
    expect(screen.getByText('Wear a mask outdoors.')).toBeDefined();
  });

  it('persists thumbs up feedback in localStorage', () => {
    render(
      <WeatherCard
        cardId="test-card-1"
        title="Test Card"
        value={42}
      />
    );

    const thumbsUpBtn = screen.getByRole('button', { name: /Thumbs Up/i });
    fireEvent.click(thumbsUpBtn);

    expect(localStorage.getItem('feedback_test-card-1')).toBe('up');
  });

  it('renders fallback empty state when isUnavailable is true', () => {
    render(
      <WeatherCard
        cardId="test-card-2"
        title="Soil Moisture"
        isUnavailable={true}
        fallbackMessage="Not available for this region"
      />
    );

    expect(screen.getByText('Soil Moisture')).toBeDefined();
    expect(screen.getByText('Not available for this region')).toBeDefined();
  });
});
