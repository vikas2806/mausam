import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from './EmptyState';
import { CloudOff } from 'lucide-react';
import '../i18n';

describe('EmptyState Component', () => {
  it('renders default title and message', () => {
    render(<EmptyState />);
    expect(screen.getByText('No Data Available')).toBeDefined();
    expect(screen.getByText('Weather data for this metric is not available.')).toBeDefined();
  });

  it('renders custom title, message, and icon', () => {
    render(
      <EmptyState
        title="No Search Results"
        message="Could not find location matching query."
        icon={CloudOff}
      />
    );
    expect(screen.getByText('No Search Results')).toBeDefined();
    expect(screen.getByText('Could not find location matching query.')).toBeDefined();
  });
});
