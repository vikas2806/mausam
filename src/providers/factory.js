import { MockWeatherProvider } from '../data/MockWeatherProvider';
import { RealWeatherProvider } from '../data/RealWeatherProvider';
import { OpenWeatherProvider, getApiKey } from './openWeatherProvider';

/**
 * Determine if real weather data should be used based on env variables.
 */
function shouldStoreUseReal() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_USE_REAL_WEATHER !== undefined) {
      return import.meta.env.VITE_USE_REAL_WEATHER === 'true' || import.meta.env.VITE_USE_REAL_WEATHER === true;
    }
    if (import.meta.env.VITE_ENABLE_MOCK_DATA !== undefined) {
      return import.meta.env.VITE_ENABLE_MOCK_DATA === 'false' || import.meta.env.VITE_ENABLE_MOCK_DATA === false;
    }
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_USE_REAL_WEATHER !== undefined) {
      return process.env.VITE_USE_REAL_WEATHER === 'true' || process.env.VITE_USE_REAL_WEATHER === true;
    }
    if (process.env.VITE_ENABLE_MOCK_DATA !== undefined) {
      return process.env.VITE_ENABLE_MOCK_DATA === 'false' || process.env.VITE_ENABLE_MOCK_DATA === false;
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
 * Switches dynamically between Mock, Open-Meteo, and OpenWeatherMap providers
 * based on environment variables or explicit parameters.
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

  // Handle boolean flag or default env fallback
  const useReal = (typeof option === 'boolean') ? option : shouldStoreUseReal();

  if (!useReal) {
    return new MockWeatherProvider();
  }

  const providerName = getEnvProviderName();
  if (providerName === 'open-meteo') {
    return new RealWeatherProvider();
  }

  // Default real provider is OpenWeatherProvider if API key or default openweather
  return new OpenWeatherProvider();
}
