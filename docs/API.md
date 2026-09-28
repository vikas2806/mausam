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

## 5. Caching & Fallback Guidelines
- **Cache Duration**: 15 minutes in memory / `sessionStorage`.
- **Fallback Strategy**: If specific data sub-objects (`marine`, `agri`, `airQuality`) are omitted or return `undefined`, corresponding persona cards gracefully display fallback messages or are hidden by the ranking engine.
