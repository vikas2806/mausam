# Mausam API & Data Provider Specification

## 1. Overview
The Mausam Personalized Homepage uses a **Data Provider Pattern**. All UI components consume data exclusively through the normalized `WeatherDataProvider` interface. Third-party APIs (IMD, CPCB/OpenAQ, Stormglass, Soil APIs) are wrapped by dedicated provider implementations.

---

## 2. Normalized Data Schema Types

```typescript
export interface LocationInfo {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  isCoastal: boolean;
  isAgriRegion: boolean;
}

export interface CurrentWeather {
  temperature: number; // Celsius
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number; // Percentage (0-100)
  windSpeed: number; // km/h
  windDirection: string; // e.g. "NW"
  conditionText: string;
  conditionCode: string;
  uvIndex: number;
  visibility: number; // km
  pressure: number; // hPa
  sunrise: string; // ISO or HH:mm
  sunset: string;
}

export interface HourlyForecastItem {
  timestamp: string;
  temperature: number;
  humidity: number;
  rainProbability: number; // Percentage (0-100)
  conditionText: string;
  icon: string;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  tempMin: number;
  tempMax: number;
  conditionText: string;
  rainProbability: number;
  icon: string;
}

export interface AirQualityData {
  aqi: number; // 0-500
  pm25: number;
  pm10: number;
  category: 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
  pollenCount?: number; // grains/m3
}

export interface MarineData {
  waveHeight: number; // meters
  waterTemp: number; // Celsius
  tideHighTime: string;
  tideLowTime: string;
  seaCondition: 'Calm' | 'Moderate' | 'Rough' | 'Very Rough';
}

export interface AgricultureData {
  soilMoisture: number; // percentage
  soilTemp: number;
  frostRisk: boolean;
  irrigationAdvice: string;
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Green' | 'Yellow' | 'Orange' | 'Red';
  issuedAt: string;
  validUntil: string;
}

export interface NormalizedWeatherData {
  location: LocationInfo;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  airQuality?: AirQualityData;
  marine?: MarineData;
  agri?: AgricultureData;
  alerts: WeatherAlert[];
}
```

---

## 3. Provider Interface Contract

```typescript
export interface WeatherDataProvider {
  getWeatherData(locationId: string): Promise<NormalizedWeatherData>;
  searchLocations(query: string): Promise<LocationInfo[]>;
}
```

---

## 4. Sample Mock Locations Supported
1. **Mumbai** (`mumbai-01`): Coastal metropolis (Marine + AQI + Heat).
2. **Delhi / Noida** (`noida-01`): Inland urban area (High AQI + Extreme Temps + Commute).
3. **Chennai** (`chennai-01`): Coastal southern city (High humidity + Beach + Rain).
4. **Shimla** (`shimla-01`): Hill station (Cold + Frost alert + Travel).
5. **Goa** (`goa-01`): Tourist coastal destination (Beach + Surfing + Travel).
6. **Punjab Farm (Ludhiana)** (`ludhiana-01`): Agricultural belt (Soil moisture + Irrigation advice).

---

## 5. OpenWeatherMap API Schema Mapping Specification

`OpenWeatherProvider` (`src/providers/openWeatherProvider.js`) integrates OpenWeatherMap REST endpoints and transforms raw payload formats into the `NormalizedWeatherData` schema:

### 5.1 Endpoints Used
1. **Current Weather**: `GET /data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={apiKey}`
2. **5-Day / 3-Hour Forecast**: `GET /data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={apiKey}`
3. **Air Pollution**: `GET /data/2.5/air_pollution?lat={lat}&lon={lon}&appid={apiKey}`
4. **Geocoding**: `GET /geo/1.0/direct?q={query}&limit=5&appid={apiKey}`

### 5.2 Mapping Table

| Normalized Field | OpenWeatherMap API Source | Transformation / Default |
|---|---|---|
| `location.name` | `weather.name` / Geocoding `name` | Location name string |
| `current.temperature` | `weather.main.temp` | Rounded integer (°C) |
| `current.feelsLike` | `weather.main.feels_like` | Rounded integer (°C) |
| `current.tempMin` | `weather.main.temp_min` | Minimum temperature (°C) |
| `current.tempMax` | `weather.main.temp_max` | Maximum temperature (°C) |
| `current.humidity` | `weather.main.humidity` | Integer percentage (0–100) |
| `current.windSpeed` | `weather.wind.speed` | Converted from m/s to km/h (`speed * 3.6`) |
| `current.conditionText` | `weather.weather[0].main` | Mapped via `OWM_CONDITION_MAP` |
| `current.visibility` | `weather.visibility` | Converted from meters to km (`/ 1000`) |
| `current.sunrise / sunset` | `weather.sys.sunrise / sunset` | Unix timestamp to `HH:mm AM/PM` string |
| `hourly[]` | `forecast.list[0..7]` | 8 3-hour slots with `pop * 100` for `rainProbability` |
| `daily[]` | `forecast.list` grouped by date | Min/Max temps and Max `pop` aggregated per day |
| `airQuality.aqi` | `air_pollution.list[0].main.aqi` | Mapped 1–5 scale to standard AQI (35, 75, 125, 175, 250) |
| `airQuality.category` | `air_pollution.list[0].main.aqi` | 1=Good, 2=Satisfactory, 3=Moderate, 4=Poor, 5=Very Poor |
| `airQuality.pm25 / pm10` | `air_pollution.list[0].components` | `pm2_5` and `pm10` values |

---

## 6. Caching & Fallback Architecture
- **Cache TTL**: 10 minutes (Dual-tier: In-memory `Map` + `localStorage`).
- **Provider Switching**: Controlled via `VITE_USE_REAL_WEATHER=true` and `VITE_WEATHER_PROVIDER=openweather` in `.env`.
- **Fallback Strategy**: If network errors occur or `OPENWEATHER_API_KEY` is missing/invalid (HTTP 401/403/50x), `OpenWeatherProvider` logs a warning and automatically falls back to `MockWeatherProvider`.

---

## 7. Dynamic Card Insight Generation & Solar UV Engine

### Solar Hour UV Calculation
To prevent invalid daytime UV values at night:
- Solar hours are computed dynamically comparing current timestamp `nowTs` against location `sunrise` and `sunset` timestamps.
- **Nighttime (`nowTs < sunrise` or `nowTs > sunset`)**: `uvIndex = 0`.
- **Daytime**: `uvIndex` scales dynamically with cloud cover reduction (`uvIndex = max(1, round(8 * (1 - cloudCover * 0.5)))`).

### Factor-Specific Card Insights
Card insights avoid canned string banks. Every card insight dynamically inspects the contributing weather factors:
- **Best Running Window**: Identifies exact limiting inputs (e.g. `high temperature (32°C)`, `high humidity (80%)`, `strong wind (32 km/h)`). References `AQI` only if air quality data is explicitly present for that persona.
- **UV Index**: Differentiates zero nighttime UV ("It's nighttime (UV 0). Solar radiation is minimal...") from daytime UV hazard tiers.
- **Wind Speed**: Combines calculated cardinal wind directions (`N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`) with numeric speed thresholds.

