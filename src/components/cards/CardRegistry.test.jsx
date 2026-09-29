import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderCard } from './CardRegistry';
import '../../i18n';

const fullMockWeatherData = {
  location: { name: 'New Delhi', region: 'Delhi', lat: 28.6139, lon: 77.2090 },
  current: {
    temperature: 28,
    feelsLike: 30,
    tempMin: 22,
    tempMax: 34,
    conditionCode: 'sunny',
    conditionText: 'Sunny Clear',
    humidity: 65,
    windSpeed: 15,
    windDirection: 'NW',
    uvIndex: 7,
    visibility: 8,
    sunrise: '06:12 AM',
    sunset: '06:45 PM'
  },
  daily: [
    { date: '12/01', dayName: 'Today', tempMin: 22, tempMax: 34, conditionText: 'Sunny', icon: 'sun', rainProbability: 20 },
    { date: '12/02', dayName: 'Tomorrow', tempMin: 23, tempMax: 35, conditionText: 'Clear', icon: 'sun', rainProbability: 10 }
  ],
  hourly: [
    { time: '12:00 PM', temperature: 28, conditionText: 'Sunny', icon: 'sun', rainProbability: 10 }
  ],
  airQuality: {
    aqi: 120,
    pm25: 45,
    pm10: 90,
    category: 'Moderate',
    pollenCount: 42
  },
  marine: {
    waveHeight: 1.8,
    waterTemp: 26,
    tideHighTime: '10:30 AM',
    tideLowTime: '04:15 PM',
    seaCondition: 'Moderate'
  },
  agri: {
    soilMoisture: 55,
    soilTemp: 24,
    frostRisk: false,
    irrigationAdvice: 'Soil moisture adequate today. Next irrigation scheduled in 3 days.'
  },
  alerts: [
    {
      id: 'alt-1',
      title: 'Thunderstorm Advisory',
      severity: 'Yellow',
      description: 'Isolated thunderstorms expected in evening.',
      issuedAt: '2026-09-28 14:00',
      validUntil: '2026-09-28 22:00'
    }
  ]
};

describe('CardRegistry Renderer', () => {
  it('renders aqi card correctly', () => {
    render(renderCard('aqi', fullMockWeatherData));
    expect(screen.getByText('Air Quality Index')).toBeDefined();
    expect(screen.getByText('120')).toBeDefined();
    expect(screen.getByText('Moderate')).toBeDefined();
  });

  it('renders uvIndex card correctly', () => {
    render(renderCard('uvIndex', fullMockWeatherData));
    expect(screen.getByText('UV Index')).toBeDefined();
    expect(screen.getByText('7')).toBeDefined();
    expect(screen.getByText('High')).toBeDefined();
  });

  it('renders pollen card correctly', () => {
    render(renderCard('pollen', fullMockWeatherData));
    expect(screen.getByText('Pollen Count')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('Moderate')).toBeDefined();
  });

  it('returns null for pollen card if airQuality is missing', () => {
    const noAir = { ...fullMockWeatherData, airQuality: null };
    expect(renderCard('pollen', noAir)).toBeNull();
  });

  it('renders humidity card correctly', () => {
    render(renderCard('humidity', fullMockWeatherData));
    expect(screen.getByText('Humidity')).toBeDefined();
    expect(screen.getByText('65')).toBeDefined();
  });

  it('renders wind card correctly', () => {
    render(renderCard('wind', fullMockWeatherData));
    expect(screen.getByText('Wind Speed')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined();
  });

  it('renders visibility card correctly', () => {
    render(renderCard('visibility', fullMockWeatherData));
    expect(screen.getByText('Visibility')).toBeDefined();
    expect(screen.getByText('8')).toBeDefined();
  });

  it('renders sunrise card correctly', () => {
    render(renderCard('sunrise', fullMockWeatherData));
    expect(screen.getByText('Sunrise & Sunset')).toBeDefined();
    expect(screen.getByText('06:12 AM')).toBeDefined();
  });

  it('renders bestRunningHours card correctly', () => {
    render(renderCard('bestRunningHours', fullMockWeatherData));
    expect(screen.getByText('Best Running Window')).toBeDefined();
  });

  it('renders rainAlert card correctly', () => {
    render(renderCard('rainAlert', fullMockWeatherData));
    expect(screen.getByText('Rain Probability')).toBeDefined();
    expect(screen.getByText('20')).toBeDefined();
  });

  it('renders commuteRisk card correctly', () => {
    render(renderCard('commuteRisk', fullMockWeatherData));
    expect(screen.getByText('Commute Risk')).toBeDefined();
  });

  it('renders comfortIndex card correctly', () => {
    render(renderCard('comfortIndex', fullMockWeatherData));
    expect(screen.getByText('Outdoor Comfort Index')).toBeDefined();
  });

  it('renders marine card correctly', () => {
    render(renderCard('marine', fullMockWeatherData));
    expect(screen.getByText('Sea Wave Height')).toBeDefined();
    expect(screen.getByText('1.8')).toBeDefined();
  });

  it('returns null for marine card if marine data is missing', () => {
    const noMarine = { ...fullMockWeatherData, marine: null };
    expect(renderCard('marine', noMarine)).toBeNull();
  });

  it('renders soilMoisture card correctly', () => {
    render(renderCard('soilMoisture', fullMockWeatherData));
    expect(screen.getByText('Soil Moisture')).toBeDefined();
    expect(screen.getByText('55')).toBeDefined();
  });

  it('renders frostAlert card correctly', () => {
    render(renderCard('frostAlert', fullMockWeatherData));
    expect(screen.getByText('Frost Risk')).toBeDefined();
    expect(screen.getByText('No Frost')).toBeDefined();
  });

  it('returns null for soilMoisture & frostAlert if agri data is missing', () => {
    const noAgri = { ...fullMockWeatherData, agri: null };
    expect(renderCard('soilMoisture', noAgri)).toBeNull();
    expect(renderCard('frostAlert', noAgri)).toBeNull();
  });

  it('renders travelAlerts card correctly', () => {
    render(renderCard('travelAlerts', fullMockWeatherData));
    expect(screen.getByText('Travel Weather Alerts')).toBeDefined();
  });

  it('renders packingSuggestion card correctly', () => {
    render(renderCard('packingSuggestion', fullMockWeatherData));
    expect(screen.getByText('Packing Suggestions')).toBeDefined();
  });

  it('maintains cross-card consistency between Running and Sunrise cards under poor conditions', () => {
    const poorConditionData = {
      ...fullMockWeatherData,
      current: { ...fullMockWeatherData.current, temperature: 32, humidity: 82 },
      airQuality: { ...fullMockWeatherData.airQuality, aqi: 160 }
    };

    const runningCard = renderCard('bestRunningHours', poorConditionData);
    const sunriseCard = renderCard('sunrise', poorConditionData);

    const { container: runningContainer } = render(runningCard);
    const { container: sunriseContainer } = render(sunriseCard);

    expect(runningContainer.textContent).toMatch(/poor air quality|conditions remain poor|Least-bad/i);
    expect(sunriseContainer.textContent).toMatch(/poor air quality|less ideal for strenuous outdoor exercise/i);
  });
});
