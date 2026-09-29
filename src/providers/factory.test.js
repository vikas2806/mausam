import { describe, it, expect } from 'vitest';
import { getWeatherProvider } from './factory';
import { MockWeatherProvider } from '../data/MockWeatherProvider';
import { OpenWeatherProvider } from './openWeatherProvider';
import { RealWeatherProvider } from '../data/RealWeatherProvider';

describe('Weather Provider Factory', () => {
  it('returns MockWeatherProvider when "mock" option is passed', () => {
    const provider = getWeatherProvider('mock');
    expect(provider).toBeInstanceOf(MockWeatherProvider);
  });

  it('returns RealWeatherProvider when "open-meteo" option is passed', () => {
    const provider = getWeatherProvider('open-meteo');
    expect(provider).toBeInstanceOf(RealWeatherProvider);
  });

  it('returns OpenWeatherProvider when "openweather" option is passed', () => {
    const provider = getWeatherProvider('openweather');
    expect(provider).toBeInstanceOf(OpenWeatherProvider);
  });

  it('returns MockWeatherProvider when false boolean flag is passed', () => {
    const provider = getWeatherProvider(false);
    expect(provider).toBeInstanceOf(MockWeatherProvider);
  });

  it('returns OpenWeatherProvider by default when true boolean flag is passed', () => {
    const provider = getWeatherProvider(true);
    expect(provider).toBeInstanceOf(OpenWeatherProvider);
  });
});
