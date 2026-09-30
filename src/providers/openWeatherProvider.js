import { WeatherDataProvider } from '../data/WeatherDataProvider';
import { MockWeatherProvider } from '../data/MockWeatherProvider';
import { RealWeatherProvider } from '../data/RealWeatherProvider';
import { KNOWN_LOCATIONS, findLocationById } from '../utils/profileStorage';

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
    this.realFallback = new RealWeatherProvider();
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
   * @param {string|object} locationParam - Location ID string or location object {id, name, state, country, lat, lon, displayName}
   * @returns {Promise<import('../data/types').NormalizedWeatherData>}
   */
  async getWeatherData(locationParam) {
    const key = this.apiKey || getApiKey();
    const locObj = typeof locationParam === 'object' && locationParam !== null ? locationParam : null;
    const locationId = locObj ? locObj.id : (locationParam || 'mumbai-01');

    if (!key) {
      console.warn('[OpenWeatherProvider] No API key found. Falling back to MockWeatherProvider.');
      return this.mockFallback.getWeatherData(locationParam);
    }

    // Resolve lat/lon from location object, known location table, or defaults
    let targetLoc = locObj;
    if (!targetLoc || typeof targetLoc.lat !== 'number' || typeof targetLoc.lon !== 'number') {
      targetLoc = findLocationById(locationId) || KNOWN_LOCATIONS.find(l => l.id === locationId) || {
        id: locationId,
        name: locObj?.name || (typeof locationParam === 'string' ? locationParam : 'Mumbai'),
        lat: 19.0760,
        lon: 72.8777
      };
    }

    const lat = targetLoc.lat ?? 19.0760;
    const lon = targetLoc.lon ?? 72.8777;

    const cacheKey = `${CACHE_PREFIX}${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = this._getCachedData(cacheKey);
    if (cached) {
      console.log('[OpenWeatherProvider] Serving cached data for:', targetLoc.name, cached);
      return cached;
    }
    console.log('[OpenWeatherProvider] Fetching live OpenWeatherMap API data for:', targetLoc.name, `(${lat}, ${lon})`);

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
      console.warn(`[OpenWeatherProvider] OWM fetch failed (${err.message}). Falling back to live Open-Meteo API.`);
      return this.realFallback.getWeatherData(targetLoc);
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

    // Format sunrise/sunset using location's timezone offset when available
    const tzOffset = weatherJson.timezone;
    const formatSunTime = (unixSec) => {
      if (!unixSec) return null;
      if (typeof tzOffset === 'number') {
        const d = new Date((unixSec + tzOffset) * 1000);
        const hours = d.getUTCHours();
        const minutes = d.getUTCMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        return `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
      }
      return new Date(unixSec * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const sunriseStr = formatSunTime(sys.sunrise) || '06:15 AM';
    const sunsetStr = formatSunTime(sys.sunset) || '06:45 PM';

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

    // Helper for wind degree to cardinal direction
    const getWindDir = (deg) => {
      if (deg === undefined || deg === null) return 'NW';
      const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      return dirs[Math.round(deg / 45) % 8];
    };

    // Calculate realistic UV index based on sun position and clouds
    const nowTs = weatherJson.dt ?? (sys.sunrise ? sys.sunrise + 100 : Math.floor(Date.now() / 1000));
    const isNight = sys.sunrise && sys.sunset ? (nowTs < sys.sunrise || nowTs > sys.sunset) : false;
    let computedUv = 0;
    if (!isNight) {
      // Approximate solar elevation noon peak ~ 8-10, reduced by cloud coverage
      const cloudCover = weatherJson.clouds?.all ?? 20;
      computedUv = Math.max(1, Math.round((8 * (1 - (cloudCover / 100) * 0.5))));
    }

    return {
      location: {
        id: location.id,
        // Prefer the user-selected location.name; OWM's weatherJson.name resolves
        // by coordinate and can return broad administrative zones (e.g. "Konkan Division")
        // instead of the specific city the user searched for.
        name: location.name || weatherJson.name,
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
        windDirection: getWindDir(wind.deg),
        conditionText: condInfo.text,
        conditionCode: condInfo.code,
        uvIndex: computedUv,
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
      return this.realFallback.searchLocations(query);
    }
    const key = this.apiKey || getApiKey();
    if (!key) {
      return this.realFallback.searchLocations(query);
    }

    try {
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${key}`;
      const res = await fetch(geoUrl);
      if (!res.ok) throw new Error(`OpenWeatherMap Geocoding Error ${res.status}`);

      const results = await res.json();
      if (!Array.isArray(results) || results.length === 0) {
        return this.realFallback.searchLocations(query);
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
      return this.realFallback.searchLocations(query);
    }
  }
}
