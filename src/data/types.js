/**
 * @typedef {Object} LocationInfo
 * @property {string} id
 * @property {string} name
 * @property {string} state
 * @property {number} lat
 * @property {number} lon
 * @property {boolean} isCoastal
 * @property {boolean} isAgriRegion
 */

/**
 * @typedef {Object} CurrentWeather
 * @property {number} temperature
 * @property {number} feelsLike
 * @property {number} tempMin
 * @property {number} tempMax
 * @property {number} humidity
 * @property {number} windSpeed
 * @property {string} windDirection
 * @property {string} conditionText
 * @property {string} conditionCode
 * @property {number} uvIndex
 * @property {number} visibility
 * @property {number} pressure
 * @property {string} sunrise
 * @property {string} sunset
 */

/**
 * @typedef {Object} HourlyForecastItem
 * @property {string} timestamp
 * @property {number} temperature
 * @property {number} humidity
 * @property {number} rainProbability
 * @property {string} conditionText
 * @property {string} icon
 */

/**
 * @typedef {Object} DailyForecastItem
 * @property {string} date
 * @property {string} dayName
 * @property {number} tempMin
 * @property {number} tempMax
 * @property {string} conditionText
 * @property {number} rainProbability
 * @property {string} icon
 */

/**
 * @typedef {Object} AirQualityData
 * @property {number} aqi
 * @property {number} pm25
 * @property {number} pm10
 * @property {'Good'|'Satisfactory'|'Moderate'|'Poor'|'Very Poor'|'Severe'} category
 * @property {number} [pollenCount]
 */

/**
 * @typedef {Object} MarineData
 * @property {number} waveHeight
 * @property {number} waterTemp
 * @property {string} tideHighTime
 * @property {string} tideLowTime
 * @property {'Calm'|'Moderate'|'Rough'|'Very Rough'} seaCondition
 */

/**
 * @typedef {Object} AgricultureData
 * @property {number} soilMoisture
 * @property {number} soilTemp
 * @property {boolean} frostRisk
 * @property {string} irrigationAdvice
 */

/**
 * @typedef {Object} WeatherAlert
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {'Green'|'Yellow'|'Orange'|'Red'} severity
 * @property {string} issuedAt
 * @property {string} validUntil
 */

/**
 * @typedef {Object} NormalizedWeatherData
 * @property {LocationInfo} location
 * @property {CurrentWeather} current
 * @property {HourlyForecastItem[]} hourly
 * @property {DailyForecastItem[]} daily
 * @property {AirQualityData} [airQuality]
 * @property {MarineData} [marine]
 * @property {AgricultureData} [agri]
 * @property {WeatherAlert[]} alerts
 */

export const SeverityLevels = {
  GREEN: 'Green',
  YELLOW: 'Yellow',
  ORANGE: 'Orange',
  RED: 'Red'
};
