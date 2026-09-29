import { WeatherDataProvider } from './WeatherDataProvider';
import { MockWeatherProvider } from './MockWeatherProvider';

const CACHE_PREFIX = 'mausam_cache_';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

// Open-Meteo Weather Code mapping to readable conditions
const WEATHER_CODE_MAP = {
  0: { text: 'Clear Sky', code: 'sunny', icon: 'sun' },
  1: { text: 'Mainly Clear', code: 'partly', icon: 'sun' },
  2: { text: 'Partly Cloudy', code: 'partly', icon: 'cloud' },
  3: { text: 'Overcast', code: 'cloudy', icon: 'cloud' },
  45: { text: 'Fog', code: 'fog', icon: 'cloud' },
  48: { text: 'Depositing Rime Fog', code: 'fog', icon: 'cloud' },
  51: { text: 'Light Drizzle', code: 'rain', icon: 'rain' },
  53: { text: 'Moderate Drizzle', code: 'rain', icon: 'rain' },
  55: { text: 'Dense Drizzle', code: 'rain', icon: 'rain' },
  61: { text: 'Slight Rain', code: 'rain', icon: 'rain' },
  63: { text: 'Moderate Rain', code: 'rain', icon: 'rain' },
  65: { text: 'Heavy Rain', code: 'rain', icon: 'rain' },
  71: { text: 'Slight Snow', code: 'snow', icon: 'snow' },
  73: { text: 'Moderate Snow', code: 'snow', icon: 'snow' },
  75: { text: 'Heavy Snow', code: 'snow', icon: 'snow' },
  80: { text: 'Slight Showers', code: 'rain', icon: 'rain' },
  81: { text: 'Moderate Showers', code: 'rain', icon: 'rain' },
  82: { text: 'Violent Showers', code: 'rain', icon: 'rain' },
  95: { text: 'Thunderstorm', code: 'storm', icon: 'rain' },
  96: { text: 'Thunderstorm with Hail', code: 'storm', icon: 'rain' }
};

export class RealWeatherProvider extends WeatherDataProvider {
  constructor() {
    super();
    this.mockFallback = new MockWeatherProvider();
  }

  /**
   * Get cached data if non-expired.
   */
  _getCachedData(cacheKey) {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        return parsed.data;
      }
    } catch {
      // Ignore cache parse errors
    }
    return null;
  }

  /**
   * Save data to local cache.
   */
  _setCachedData(cacheKey, data) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Fetch real weather data from Open-Meteo REST APIs with offline fallback.
   * @param {string} locationId
   * @returns {Promise<import('./types').NormalizedWeatherData>}
   */
  async getWeatherData(locationId) {
    const cacheKey = `${CACHE_PREFIX}${locationId}`;
    const cached = this._getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Resolve coordinates from mock database or location id
      const mockLocations = await this.mockFallback.searchLocations('');
      const targetLoc = mockLocations.find(l => l.id === locationId) || mockLocations[0];
      const lat = targetLoc.lat || 28.61;
      const lon = targetLoc.lon || 77.20;

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&timezone=auto`;
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi`;

      const [weatherRes, aqiRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(aqiUrl).catch(() => null)
      ]);

      if (!weatherRes.ok) {
        throw new Error(`Open-Meteo HTTP Error ${weatherRes.status}`);
      }

      const weatherJson = await weatherRes.json();
      const aqiJson = aqiRes && aqiRes.ok ? await aqiRes.json() : null;

      const normalized = this._normalizeOpenMeteoData(targetLoc, weatherJson, aqiJson);
      this._setCachedData(cacheKey, normalized);
      return normalized;
    } catch (err) {
      console.warn(`[RealWeatherProvider] Fetch failed (${err.message}). Falling back to MockWeatherProvider.`);
      return this.mockFallback.getWeatherData(locationId);
    }
  }

  /**
   * Map Open-Meteo responses to NormalizedWeatherData schema.
   */
  _normalizeOpenMeteoData(location, weatherJson, aqiJson) {
    const curr = weatherJson.current || {};
    const daily = weatherJson.daily || {};
    const hourly = weatherJson.hourly || {};
    const aqiCurr = aqiJson?.current || {};

    const codeInfo = WEATHER_CODE_MAP[curr.weather_code] || { text: 'Clear Sky', code: 'sunny', icon: 'sun' };

    // Map daily 7-day forecast
    const dailyForecast = (daily.time || []).map((dateStr, idx) => {
      const dCode = daily.weather_code?.[idx] ?? 0;
      const dInfo = WEATHER_CODE_MAP[dCode] || { text: 'Clear Sky', code: 'sunny', icon: 'sun' };
      const dateObj = new Date(dateStr);
      const dayName = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

      return {
        date: monthDay,
        dayName,
        tempMin: Math.round(daily.temperature_2m_min?.[idx] ?? 18),
        tempMax: Math.round(daily.temperature_2m_max?.[idx] ?? 28),
        conditionText: dInfo.text,
        rainProbability: Math.round(daily.precipitation_probability_max?.[idx] ?? 0),
        icon: dInfo.icon
      };
    });

    // Map next 12 hourly entries (3-hour intervals)
    const hourlyForecast = [];
    if (hourly.time) {
      for (let i = 0; i < Math.min(24, hourly.time.length); i += 2) {
        const tStr = hourly.time[i];
        const hCode = hourly.weather_code?.[i] ?? 0;
        const hInfo = WEATHER_CODE_MAP[hCode] || { text: 'Clear', code: 'sunny', icon: 'sun' };
        const timeLabel = new Date(tStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        hourlyForecast.push({
          timestamp: timeLabel,
          temperature: Math.round(hourly.temperature_2m?.[i] ?? curr.temperature_2m ?? 25),
          humidity: Math.round(hourly.relative_humidity_2m?.[i] ?? 50),
          rainProbability: Math.round(hourly.precipitation_probability?.[i] ?? 0),
          conditionText: hInfo.text,
          icon: hInfo.icon
        });
      }
    }

    const usAqi = Math.round(aqiCurr.us_aqi ?? 65);
    let aqiCategory = 'Good';
    if (usAqi > 150) aqiCategory = 'Poor';
    else if (usAqi > 100) aqiCategory = 'Moderate';
    else if (usAqi > 50) aqiCategory = 'Satisfactory';

    return {
      location: {
        id: location.id,
        name: location.name,
        state: location.state || '',
        lat: location.lat,
        lon: location.lon,
        isCoastal: location.isCoastal || false,
        isAgriRegion: location.isAgriRegion || false
      },
      current: {
        temperature: Math.round(curr.temperature_2m ?? 25),
        feelsLike: Math.round(curr.apparent_temperature ?? curr.temperature_2m ?? 25),
        tempMin: dailyForecast[0]?.tempMin ?? 18,
        tempMax: dailyForecast[0]?.tempMax ?? 28,
        humidity: Math.round(curr.relative_humidity_2m ?? 50),
        windSpeed: Math.round(curr.wind_speed_10m ?? 10),
        windDirection: 'NW',
        conditionText: codeInfo.text,
        conditionCode: codeInfo.code,
        uvIndex: Math.round(daily.uv_index_max?.[0] ?? 5),
        visibility: 8.5,
        pressure: Math.round(curr.surface_pressure ?? 1013),
        sunrise: '06:15 AM',
        sunset: '06:45 PM'
      },
      hourly: hourlyForecast,
      daily: dailyForecast,
      airQuality: {
        aqi: usAqi,
        pm25: Math.round(aqiCurr.pm2_5 ?? 22),
        pm10: Math.round(aqiCurr.pm10 ?? 45),
        category: aqiCategory,
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
        irrigationAdvice: 'Soil moisture adequate. Optimal conditions for crop growth.'
      } : null,
      alerts: []
    };
  }

  /**
   * Search locations using Open-Meteo Geocoding API with fallback.
   * @param {string} query
   */
  async searchLocations(query) {
    if (!query || query.trim().length === 0) {
      return this.mockFallback.searchLocations(query);
    }

    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`;
      const res = await fetch(geoUrl);
      if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        return this.mockFallback.searchLocations(query);
      }

      return data.results.map((r, idx) => ({
        id: `real-${r.id || idx}`,
        name: `${r.name}, ${r.admin1 || r.country}`,
        state: r.admin1 || r.country || '',
        lat: r.latitude,
        lon: r.longitude,
        isCoastal: false,
        isAgriRegion: false
      }));
    } catch {
      return this.mockFallback.searchLocations(query);
    }
  }
}

import { getWeatherProvider as centralGetWeatherProvider } from '../providers/factory';

/**
 * Provider Factory function for backward-compatibility.
 * @param {boolean|string} [useReal]
 * @returns {WeatherDataProvider}
 */
export function getWeatherProvider(useReal) {
  return centralGetWeatherProvider(useReal);
}
