import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AlertBanner } from './AlertBanner';
import '../i18n';

const sampleAlerts = [
  {
    id: 'alt-1',
    title: 'Severe Thunderstorm Warning',
    severity: 'Red',
    description: 'Damaging winds up to 80 km/h and hail expected.',
    issuedAt: '2026-09-28T18:00:00Z',
    validUntil: '2026-09-28T22:00:00Z'
  }
];

describe('AlertBanner Component', () => {
  it('returns null when no alerts are present', () => {
    const { container } = render(<AlertBanner alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title, description, and severity style when active alert present', () => {
    render(<AlertBanner alerts={sampleAlerts} />);
    expect(screen.getByText('Severe Thunderstorm Warning')).toBeDefined();
    expect(screen.getByText('Damaging winds up to 80 km/h and hail expected.')).toBeDefined();
    const banner = screen.getByTestId('alert-banner');
    expect(banner.className).toContain('Red');
  });

  it('toggles expansion details on button click', () => {
    render(<AlertBanner alerts={sampleAlerts} />);
    const toggleBtn = screen.getByRole('button', { name: /Toggle details/i });

    expect(screen.queryByText(/Issued:/i)).toBeNull();

    fireEvent.click(toggleBtn);

    expect(screen.getByText(/Issued:/i)).toBeDefined();
    expect(screen.getByText(/Valid Until:/i)).toBeDefined();
  });
});
