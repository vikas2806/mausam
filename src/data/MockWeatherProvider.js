import { WeatherDataProvider } from './WeatherDataProvider';

const MOCK_LOCATIONS = [
  { id: 'noida-01', name: 'Sector 2, Noida', state: 'Uttar Pradesh', lat: 28.58, lon: 77.31, isCoastal: false, isAgriRegion: false },
  { id: 'mumbai-01', name: 'Marine Drive, Mumbai', state: 'Maharashtra', lat: 18.94, lon: 72.82, isCoastal: true, isAgriRegion: false },
  { id: 'chennai-01', name: 'Marina Beach, Chennai', state: 'Tamil Nadu', lat: 13.05, lon: 80.28, isCoastal: true, isAgriRegion: false },
  { id: 'shimla-01', name: 'Mall Road, Shimla', state: 'Himachal Pradesh', lat: 31.10, lon: 77.17, isCoastal: false, isAgriRegion: false },
  { id: 'goa-01', name: 'Calangute, Goa', state: 'Goa', lat: 15.54, lon: 73.76, isCoastal: true, isAgriRegion: false },
  { id: 'ludhiana-01', name: 'Ludhiana Agricultural District', state: 'Punjab', lat: 30.90, lon: 75.85, isCoastal: false, isAgriRegion: true }
];

const MOCK_WEATHER_DATABASE = {
  'noida-01': {
    location: MOCK_LOCATIONS[0],
    current: {
      temperature: 11.4,
      feelsLike: 10.2,
      tempMin: 6.6,
      tempMax: 16.0,
      humidity: 99,
      windSpeed: 12,
      windDirection: 'NW',
      conditionText: 'Dense Fog / Clear Sky',
      conditionCode: 'fog',
      uvIndex: 6,
      visibility: 1.5,
      pressure: 1016,
      sunrise: '07:15',
      sunset: '17:45'
    },
    hourly: [
      { timestamp: '19:30', temperature: 15.7, humidity: 41.2, rainProbability: 0, conditionText: 'Clear', icon: 'cloud-rain' },
      { timestamp: '20:30', temperature: 15.0, humidity: 46.8, rainProbability: 0, conditionText: 'Clear', icon: 'sun' },
      { timestamp: '21:30', temperature: 14.3, humidity: 49.7, rainProbability: 0, conditionText: 'Clear', icon: 'cloud-rain' },
      { timestamp: '22:30', temperature: 14.0, humidity: 51.1, rainProbability: 0, conditionText: 'Clear', icon: 'cloud-rain' }
    ],
    daily: [
      { date: '12/01', dayName: 'Today', tempMin: 7.0, tempMax: 17.0, conditionText: 'Foggy Morning', rainProbability: 5, icon: 'rain' },
      { date: '13/01', dayName: 'Saturday', tempMin: 7.0, tempMax: 18.0, conditionText: 'Clear Sky', rainProbability: 0, icon: 'sun' },
      { date: '14/01', dayName: 'Sunday', tempMin: 7.0, tempMax: 18.0, conditionText: 'Partly Cloudy', rainProbability: 10, icon: 'cloud' },
      { date: '15/01', dayName: 'Monday', tempMin: 6.0, tempMax: 19.0, conditionText: 'Sunny', rainProbability: 0, icon: 'sun' },
      { date: '16/01', dayName: 'Tuesday', tempMin: 6.0, tempMax: 20.0, conditionText: 'Sunny', rainProbability: 0, icon: 'sun' }
    ],
    airQuality: {
      aqi: 185,
      pm25: 112,
      pm10: 190,
      category: 'Poor',
      pollenCount: 45
    },
    alerts: [
      {
        id: 'alt-noida-01',
        title: 'Dense Fog Warning (IMD Orange Alert)',
        description: 'Visibility drops below 200m during 06:00 - 09:30 AM. Exercise extreme caution during commute.',
        severity: 'Orange',
        issuedAt: '2026-09-28T05:00:00Z',
        validUntil: '2026-09-29T11:00:00Z'
      }
    ]
  },
  'mumbai-01': {
    location: MOCK_LOCATIONS[1],
    current: {
      temperature: 29.5,
      feelsLike: 34.1,
      tempMin: 24.0,
      tempMax: 33.2,
      humidity: 88,
      windSpeed: 22,
      windDirection: 'SW',
      conditionText: 'Humid & Breezy',
      conditionCode: 'breezy',
      uvIndex: 8,
      visibility: 8.0,
      pressure: 1009,
      sunrise: '06:45',
      sunset: '18:30'
    },
    hourly: [
      { timestamp: '19:30', temperature: 28.5, humidity: 85, rainProbability: 15, conditionText: 'Breezy', icon: 'wind' },
      { timestamp: '20:30', temperature: 28.0, humidity: 87, rainProbability: 10, conditionText: 'Partly Cloudy', icon: 'cloud' }
    ],
    daily: [
      { date: '12/01', dayName: 'Today', tempMin: 24.0, tempMax: 33.2, conditionText: 'Humid', rainProbability: 20, icon: 'sun' },
      { date: '13/01', dayName: 'Saturday', tempMin: 25.0, tempMax: 34.0, conditionText: 'Clear', rainProbability: 10, icon: 'sun' }
    ],
    airQuality: {
      aqi: 92,
      pm25: 31,
      pm10: 65,
      category: 'Satisfactory',
      pollenCount: 15
    },
    marine: {
      waveHeight: 1.8,
      waterTemp: 27.5,
      tideHighTime: '11:45 AM',
      tideLowTime: '05:30 PM',
      seaCondition: 'Moderate'
    },
    alerts: [
      {
        id: 'alt-mumbai-01',
        title: 'High Swell & Tidal Surge Watch',
        description: 'Moderate wave height up to 1.8m expected around high tide.',
        severity: 'Yellow',
        issuedAt: '2026-09-28T08:00:00Z',
        validUntil: '2026-09-29T20:00:00Z'
      }
    ]
  },
  'chennai-01': {
    location: MOCK_LOCATIONS[2],
    current: {
      temperature: 31.0,
      feelsLike: 36.5,
      tempMin: 25.0,
      tempMax: 33.0,
      humidity: 82,
      windSpeed: 18,
      windDirection: 'E',
      conditionText: 'Sunny & Warm',
      conditionCode: 'sunny',
      uvIndex: 9,
      visibility: 9.0,
      pressure: 1010,
      sunrise: '06:15',
      sunset: '18:10'
    },
    hourly: [
      { timestamp: '19:30', temperature: 29.5, humidity: 84, rainProbability: 5, conditionText: 'Clear', icon: 'sun' }
    ],
    daily: [
      { date: '12/01', dayName: 'Today', tempMin: 25.0, tempMax: 33.0, conditionText: 'Sunny', rainProbability: 5, icon: 'sun' }
    ],
    airQuality: {
      aqi: 65,
      pm25: 18,
      pm10: 42,
      category: 'Satisfactory',
      pollenCount: 10
    },
    marine: {
      waveHeight: 1.2,
      waterTemp: 28.0,
      tideHighTime: '09:20 AM',
      tideLowTime: '03:45 PM',
      seaCondition: 'Calm'
    },
    alerts: []
  },
  'shimla-01': {
    location: MOCK_LOCATIONS[3],
    current: {
      temperature: 4.2,
      feelsLike: 1.8,
      tempMin: -1.0,
      tempMax: 9.0,
      humidity: 55,
      windSpeed: 14,
      windDirection: 'N',
      conditionText: 'Cold & Crisp Sky',
      conditionCode: 'cold',
      uvIndex: 4,
      visibility: 10.0,
      pressure: 1022,
      sunrise: '07:20',
      sunset: '17:35'
    },
    hourly: [
      { timestamp: '19:30', temperature: 3.5, humidity: 60, rainProbability: 0, conditionText: 'Clear Cold', icon: 'sun' }
    ],
    daily: [
      { date: '12/01', dayName: 'Today', tempMin: -1.0, tempMax: 9.0, conditionText: 'Frost Hazard', rainProbability: 0, icon: 'sun' }
    ],
    airQuality: {
      aqi: 35,
      pm25: 8,
      pm10: 22,
      category: 'Good',
      pollenCount: 80
    },
    alerts: [
      {
        id: 'alt-shimla-01',
        title: 'Ground Frost Hazard Alert',
        description: 'Night temperatures expected to drop below sub-zero. Protect domestic water supply pipes.',
        severity: 'Yellow',
        issuedAt: '2026-09-28T04:00:00Z',
        validUntil: '2026-09-30T08:00:00Z'
      }
    ]
  },
  'goa-01': {
    location: MOCK_LOCATIONS[4],
    current: {
      temperature: 30.5,
      feelsLike: 35.0,
      tempMin: 23.5,
      tempMax: 32.0,
      humidity: 78,
      windSpeed: 16,
      windDirection: 'SW',
      conditionText: 'Clear Beach Sky',
      conditionCode: 'sunny',
      uvIndex: 9,
      visibility: 10.0,
      pressure: 1011,
      sunrise: '06:35',
      sunset: '18:40'
    },
    hourly: [
      { timestamp: '19:30', temperature: 28.0, humidity: 80, rainProbability: 0, conditionText: 'Clear', icon: 'sun' }
    ],
    daily: [
      { date: '12/01', dayName: 'Today', tempMin: 23.5, tempMax: 32.0, conditionText: 'Sunny Beach Weather', rainProbability: 0, icon: 'sun' }
    ],
    airQuality: {
      aqi: 45,
      pm25: 12,
      pm10: 30,
      category: 'Good',
      pollenCount: 12
    },
    marine: {
      waveHeight: 2.2,
      waterTemp: 28.5,
      tideHighTime: '10:15 AM',
      tideLowTime: '04:20 PM',
      seaCondition: 'Rough'
    },
    alerts: []
  },
  'ludhiana-01': {
    location: MOCK_LOCATIONS[5],
    current: {
      temperature: 14.5,
      feelsLike: 13.8,
      tempMin: 8.0,
      tempMax: 20.0,
      humidity: 72,
      windSpeed: 10,
      windDirection: 'NW',
      conditionText: 'Partly Sunny / Agri Belt',
      conditionCode: 'sunny',
      uvIndex: 5,
      visibility: 6.0,
      pressure: 1015,
      sunrise: '07:18',
      sunset: '17:42'
    },
    hourly: [
      { timestamp: '19:30', temperature: 13.0, humidity: 75, rainProbability: 0, conditionText: 'Clear', icon: 'sun' }
    ],
    daily: [
      { date: '12/01', dayName: 'Today', tempMin: 8.0, tempMax: 20.0, conditionText: 'Favorable Crop Conditions', rainProbability: 0, icon: 'sun' }
    ],
    airQuality: {
      aqi: 125,
      pm25: 65,
      pm10: 130,
      category: 'Moderate',
      pollenCount: 110
    },
    agri: {
      soilMoisture: 42,
      soilTemp: 18.2,
      frostRisk: false,
      irrigationAdvice: 'Soil moisture adequate for wheat crop. Defer light irrigation until weekend.'
    },
    alerts: []
  }
};

export class MockWeatherProvider extends WeatherDataProvider {
  async getWeatherData(locationId) {
    // Return requested location or default to Noida if not found
    const data = MOCK_WEATHER_DATABASE[locationId] || MOCK_WEATHER_DATABASE['noida-01'];
    return JSON.parse(JSON.stringify(data));
  }

  async searchLocations(query) {
    if (!query) return MOCK_LOCATIONS;
    const lower = query.toLowerCase();
    return MOCK_LOCATIONS.filter(loc =>
      loc.name.toLowerCase().includes(lower) ||
      loc.state.toLowerCase().includes(lower)
    );
  }
}
