import { MockWeatherProvider } from '../data/MockWeatherProvider';
import { RealWeatherProvider } from '../data/RealWeatherProvider';
import { OpenWeatherProvider } from './openWeatherProvider';

/**
 * Determine if mock data is explicitly enabled.
 */
function isMockExplicitlyEnabled() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_ENABLE_MOCK_DATA !== undefined) {
      return import.meta.env.VITE_ENABLE_MOCK_DATA === 'true' || import.meta.env.VITE_ENABLE_MOCK_DATA === true;
    }
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_ENABLE_MOCK_DATA !== undefined) {
      return process.env.VITE_ENABLE_MOCK_DATA === 'true' || process.env.VITE_ENABLE_MOCK_DATA === true;
    }
  }
  return false;
}

/**
 * Get active provider name from env variables.
 */
function getEnvProviderName() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_WEATHER_PROVIDER) return import.meta.env.VITE_WEATHER_PROVIDER;
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_WEATHER_PROVIDER) return process.env.VITE_WEATHER_PROVIDER;
  }
  return 'openweather';
}

/**
 * Weather Provider Factory function.
 * Returns real live API providers (OpenWeatherMap / Open-Meteo) by default.
 *
 * @param {boolean|string} [option] - true/false or provider name ('openweather', 'open-meteo', 'mock')
 * @returns {import('../data/WeatherDataProvider').WeatherDataProvider}
 */
export function getWeatherProvider(option) {
  if (option === 'mock') {
    return new MockWeatherProvider();
  }
  if (option === 'open-meteo') {
    return new RealWeatherProvider();
  }
  if (option === 'openweather') {
    return new OpenWeatherProvider();
  }

  // If mock is explicitly requested via option=false or env
  if (option === false || isMockExplicitlyEnabled()) {
    return new MockWeatherProvider();
  }

  const providerName = getEnvProviderName();
  if (providerName === 'open-meteo') {
    return new RealWeatherProvider();
  }

  // Default to real live OpenWeatherProvider (with automatic Open-Meteo live API fallback)
  return new OpenWeatherProvider();
}
