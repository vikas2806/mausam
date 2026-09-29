import { WeatherDataProvider } from '../data/WeatherDataProvider';
import { MockWeatherProvider } from '../data/MockWeatherProvider';

/**
 * Weather condition mapping for OpenWeatherMap icon/weather codes.
 */
const OWM_CONDITION_MAP = {
  Thunderstorm: { text: 'Thunderstorm', code: 'storm', icon: 'rain' },
  Drizzle:      { text: 'Light Drizzle', code: 'rain', icon: 'rain' },
  Rain:         { text: 'Rain', code: 'rain', icon: 'rain' },
  Snow:         { text: 'Snow', code: 'snow', icon: 'snow' },
  Mist:         { text: 'Mist', code: 'fog', icon: 'cloud' },
  Smoke:        { text: 'Smoke', code: 'fog', icon: 'cloud' },
  Haze:         { text: 'Haze', code: 'fog', icon: 'cloud' },
  Dust:         { text: 'Dust', code: 'fog', icon: 'cloud' },
  Fog:          { text: 'Fog', code: 'fog', icon: 'cloud' },
  Sand:         { text: 'Sandstorm', code: 'fog', icon: 'cloud' },
  Ash:          { text: 'Volcanic Ash', code: 'fog', icon: 'cloud' },
  Squall:       { text: 'Squall', code: 'windy', icon: 'cloud' },
  Tornado:      { text: 'Tornado', code: 'storm', icon: 'rain' },
  Clear:        { text: 'Clear Sky', code: 'sunny', icon: 'sun' },
  Clouds:       { text: 'Partly Cloudy', code: 'partly', icon: 'cloud' }
};

/**
 * Helper to get the API Key safely across Vite frontend and Node test environments.
 */
export function getApiKey() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_OPENWEATHER_API_KEY) return import.meta.env.VITE_OPENWEATHER_API_KEY;
    if (import.meta.env.OPENWEATHER_API_KEY) return import.meta.env.OPENWEATHER_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_OPENWEATHER_API_KEY) return process.env.VITE_OPENWEATHER_API_KEY;
    if (process.env.OPENWEATHER_API_KEY) return process.env.OPENWEATHER_API_KEY;
  }
  return '';
}

const CACHE_PREFIX = 'owm_cache_';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

export class OpenWeatherProvider extends WeatherDataProvider {
  constructor(apiKey = getApiKey()) {
    super();
    this.apiKey = apiKey;
    this.mockFallback = new MockWeatherProvider();
    this._inMemoryCache = new Map();
  }

  /**
   * Get non-expired cached data from memory or localStorage.
   * @param {string} cacheKey
   */
  _getCachedData(cacheKey) {
    // 1. Check in-memory cache
    const memEntry = this._inMemoryCache.get(cacheKey);
    if (memEntry && (Date.now() - memEntry.timestamp < CACHE_TTL_MS)) {
      return memEntry.data;
    }

    // 2. Check localStorage cache
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            this._inMemoryCache.set(cacheKey, parsed);
            return parsed.data;
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  }

  /**
   * Save data to both in-memory cache and localStorage.
   * @param {string} cacheKey
   * @param {object} data
   */
  _setCachedData(cacheKey, data) {
    const entry = { timestamp: Date.now(), data };
    this._inMemoryCache.set(cacheKey, entry);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      }
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Fetch normalized weather data using OpenWeatherMap REST APIs.
   * @param {string} locationId
   * @returns {Promise<import('../data/types').NormalizedWeatherData>}
   */
  async getWeatherData(locationId) {
    const key = this.apiKey || getApiKey();
    if (!key) {
      console.warn('[OpenWeatherProvider] No API key found. Falling back to MockWeatherProvider.');
      return this.mockFallback.getWeatherData(locationId);
    }

    const cacheKey = `${CACHE_PREFIX}${locationId}`;
    const cached = this._getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Resolve lat/lon from mock location table or defaults
    const mockLocations = await this.mockFallback.searchLocations('');
    const targetLoc = mockLocations.find(l => l.id === locationId) || mockLocations[0];
    const lat = targetLoc.lat || 28.61;
    const lon = targetLoc.lon || 77.20;

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
    const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`;

    try {
      const [weatherRes, forecastRes, pollutionRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(forecastUrl),
        fetch(pollutionUrl).catch(() => null)
      ]);

      if (!weatherRes.ok) {
        throw new Error(`OpenWeatherMap Weather API Error ${weatherRes.status}`);
      }

      const weatherJson = await weatherRes.json();
      const forecastJson = forecastRes.ok ? await forecastRes.json() : { list: [] };
      const pollutionJson = pollutionRes && pollutionRes.ok ? await pollutionRes.json() : null;

      const normalized = this._normalizeData(targetLoc, weatherJson, forecastJson, pollutionJson);
      this._setCachedData(cacheKey, normalized);
      return normalized;
    } catch (err) {
      console.warn(`[OpenWeatherProvider] Fetch failed (${err.message}). Falling back to MockWeatherProvider.`);
      return this.mockFallback.getWeatherData(locationId);
    }
  }

  /**
   * Map OpenWeatherMap API responses to NormalizedWeatherData schema.
   */
  _normalizeData(location, weatherJson, forecastJson, pollutionJson) {
    const main = weatherJson.main || {};
    const wind = weatherJson.wind || {};
    const weatherCond = weatherJson.weather?.[0] || {};
    const sys = weatherJson.sys || {};

    const mainCondGroup = weatherCond.main || 'Clear';
    const condInfo = OWM_CONDITION_MAP[mainCondGroup] || { text: weatherCond.description || 'Clear Sky', code: 'sunny', icon: 'sun' };

    // Format sunrise/sunset
    const sunriseStr = sys.sunrise
      ? new Date(sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '06:15 AM';
    const sunsetStr = sys.sunset
      ? new Date(sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '06:45 PM';

    // Parse forecast list (3-hour slots) into hourly entries
    const list = forecastJson.list || [];
    const hourlyForecast = list.slice(0, 8).map(item => {
      const hCondGroup = item.weather?.[0]?.main || 'Clear';
      const hInfo = OWM_CONDITION_MAP[hCondGroup] || { text: 'Clear', code: 'sunny', icon: 'sun' };
      const timeLabel = new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      return {
        timestamp: timeLabel,
        temperature: Math.round(item.main?.temp ?? main.temp ?? 25),
        humidity: Math.round(item.main?.humidity ?? 50),
        rainProbability: Math.round((item.pop ?? 0) * 100),
        conditionText: hInfo.text,
        icon: hInfo.icon
      };
    });

    // Group 3-hour slots into daily items (5-day forecast)
    const dailyMap = {};
    for (const item of list) {
      const dateObj = new Date(item.dt * 1000);
      const dateKey = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      if (!dailyMap[dateKey]) {
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dCondGroup = item.weather?.[0]?.main || 'Clear';
        const dInfo = OWM_CONDITION_MAP[dCondGroup] || { text: 'Clear Sky', code: 'sunny', icon: 'sun' };
        dailyMap[dateKey] = {
          date: dateKey,
          dayName: Object.keys(dailyMap).length === 0 ? 'Today' : dayName,
          tempMin: Math.round(item.main?.temp_min ?? main.temp_min ?? 20),
          tempMax: Math.round(item.main?.temp_max ?? main.temp_max ?? 30),
          conditionText: dInfo.text,
          rainProbability: Math.round((item.pop ?? 0) * 100),
          icon: dInfo.icon
        };
      } else {
        dailyMap[dateKey].tempMin = Math.min(dailyMap[dateKey].tempMin, Math.round(item.main?.temp_min ?? 20));
        dailyMap[dateKey].tempMax = Math.max(dailyMap[dateKey].tempMax, Math.round(item.main?.temp_max ?? 30));
        dailyMap[dateKey].rainProbability = Math.max(dailyMap[dateKey].rainProbability, Math.round((item.pop ?? 0) * 100));
      }
    }
    const dailyForecast = Object.values(dailyMap).slice(0, 7);

    // Air pollution mapping (OWM Air Pollution Index 1..5)
    const polComponents = pollutionJson?.list?.[0]?.components || {};
    const owmAqi = pollutionJson?.list?.[0]?.main?.aqi ?? 2;
    // Map OWM 1..5 scale to standard AQI approximate values & categories
    const aqiCategoryMap = { 1: 'Good', 2: 'Satisfactory', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };
    const aqiValueMap = { 1: 35, 2: 75, 3: 125, 4: 175, 5: 250 };

    const category = aqiCategoryMap[owmAqi] || 'Moderate';
    const computedAqi = aqiValueMap[owmAqi] || 85;

    return {
      location: {
        id: location.id,
        name: weatherJson.name || location.name,
        state: location.state || '',
        lat: location.lat,
        lon: location.lon,
        isCoastal: location.isCoastal || false,
        isAgriRegion: location.isAgriRegion || false
      },
      current: {
        temperature: Math.round(main.temp ?? 25),
        feelsLike: Math.round(main.feels_like ?? main.temp ?? 25),
        tempMin: Math.round(main.temp_min ?? dailyForecast[0]?.tempMin ?? 18),
        tempMax: Math.round(main.temp_max ?? dailyForecast[0]?.tempMax ?? 28),
        humidity: Math.round(main.humidity ?? 50),
        windSpeed: Math.round((wind.speed ?? 3) * 3.6), // m/s to km/h
        windDirection: 'NW',
        conditionText: condInfo.text,
        conditionCode: condInfo.code,
        uvIndex: 5,
        visibility: weatherJson.visibility ? Math.round((weatherJson.visibility / 1000) * 10) / 10 : 8.5,
        pressure: Math.round(main.pressure ?? 1013),
        sunrise: sunriseStr,
        sunset: sunsetStr
      },
      hourly: hourlyForecast,
      daily: dailyForecast,
      airQuality: {
        aqi: computedAqi,
        pm25: Math.round(polComponents.pm2_5 ?? 22),
        pm10: Math.round(polComponents.pm10 ?? 45),
        category,
        pollenCount: 35
      },
      marine: location.isCoastal ? {
        waveHeight: 1.2,
        waterTemp: 26,
        tideHighTime: '10:15 AM',
        tideLowTime: '04:30 PM',
        seaCondition: 'Moderate'
      } : null,
      agri: location.isAgriRegion ? {
        soilMoisture: 58,
        soilTemp: 22,
        frostRisk: false,
        irrigationAdvice: 'Soil moisture adequate.'
      } : null,
      alerts: []
    };
  }

  /**
   * Search locations using OpenWeatherMap Geocoding API.
   * @param {string} query
   * @returns {Promise<import('../data/types').LocationInfo[]>}
   */
  async searchLocations(query) {
    if (!query || query.trim().length === 0) {
      return this.mockFallback.searchLocations(query);
    }
    const key = this.apiKey || getApiKey();
    if (!key) {
      return this.mockFallback.searchLocations(query);
    }

    try {
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${key}`;
      const res = await fetch(geoUrl);
      if (!res.ok) throw new Error(`OpenWeatherMap Geocoding Error ${res.status}`);

      const results = await res.json();
      if (!Array.isArray(results) || results.length === 0) {
        return this.mockFallback.searchLocations(query);
      }

      return results.map((r, idx) => ({
        id: `owm-${r.lat.toFixed(2)}-${r.lon.toFixed(2)}`,
        name: `${r.name}, ${r.state || r.country}`,
        state: r.state || r.country || '',
        lat: r.lat,
        lon: r.lon,
        isCoastal: false,
        isAgriRegion: false
      }));
    } catch {
      return this.mockFallback.searchLocations(query);
    }
  }
}
