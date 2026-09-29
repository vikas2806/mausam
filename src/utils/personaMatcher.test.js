import { describe, it, expect } from 'vitest';
import { matchPersonasByQuery } from './personaMatcher';
import PERSONAS from '../config/personas.json';

describe('matchPersonasByQuery', () => {
  it('returns empty array for empty query', () => {
    expect(matchPersonasByQuery('', PERSONAS)).toEqual([]);
    expect(matchPersonasByQuery('   ', PERSONAS)).toEqual([]);
  });

  it('matches beach persona when user types "I am a beach person"', () => {
    const matches = matchPersonasByQuery("I am a beach person", PERSONAS);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].id).toBe('beach');
  });

  it('matches fitness persona when user types "I run every morning"', () => {
    const matches = matchPersonasByQuery('I run every morning', PERSONAS);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].id).toBe('fitness');
  });

  it('matches health persona when user types "I have asthma and dust allergy"', () => {
    const matches = matchPersonasByQuery('I have asthma and dust allergy', PERSONAS);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].id).toBe('health');
  });

  it('matches multiple relevant personas when multiple keywords match', () => {
    const matches = matchPersonasByQuery('outdoor running and surfing', PERSONAS);
    const ids = matches.map(p => p.id);
    expect(ids).toContain('fitness');
    expect(ids).toContain('beach');
  });
});
