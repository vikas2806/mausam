import React from 'react';
import {
  Activity, Sun, Wind, Droplets, Eye, Sunrise,
  Waves, Plane, Users, Sprout, Car, Calendar,
  CloudRain, Thermometer, Leaf, AlertTriangle
} from 'lucide-react';
import { WeatherCard } from '../WeatherCard';
import { bestRunningHours, comfortIndex, commuteRisk, packingSuggestion } from '../../engine/metrics';

/** Maps a numeric AQI to an IMD severity badge */
function aqiBadge(aqi) {
  if (aqi <= 50)  return { text: 'Good',       severity: 'Green' };
  if (aqi <= 100) return { text: 'Satisfactory', severity: 'Green' };
  if (aqi <= 200) return { text: 'Moderate',   severity: 'Yellow' };
  if (aqi <= 300) return { text: 'Poor',        severity: 'Orange' };
  return            { text: 'Severe',           severity: 'Red' };
}

function uvBadge(uv) {
  if (uv <= 2)  return { text: 'Low',       severity: 'Green' };
  if (uv <= 5)  return { text: 'Moderate',  severity: 'Yellow' };
  if (uv <= 7)  return { text: 'High',      severity: 'Orange' };
  if (uv <= 10) return { text: 'Very High', severity: 'Red' };
  return          { text: 'Extreme',        severity: 'Red' };
}

function windBadge(speed) {
  if (speed < 20)  return { text: 'Calm',     severity: 'Green' };
  if (speed < 40)  return { text: 'Breezy',   severity: 'Yellow' };
  if (speed < 60)  return { text: 'Strong',   severity: 'Orange' };
  return             { text: 'Gale',          severity: 'Red' };
}

function rainBadge(prob) {
  if (prob < 20)  return { text: 'Unlikely',  severity: 'Green' };
  if (prob < 50)  return { text: 'Possible',  severity: 'Yellow' };
  if (prob < 70)  return { text: 'Likely',    severity: 'Orange' };
  return            { text: 'Very Likely',    severity: 'Red' };
}

function visiBadge(km) {
  if (km >= 10)  return { text: 'Clear',      severity: 'Green' };
  if (km >= 4)   return { text: 'Moderate',   severity: 'Yellow' };
  if (km >= 1)   return { text: 'Poor',       severity: 'Orange' };
  return           { text: 'Dense Fog',       severity: 'Red' };
}

/**
 * Registry mapping every cardId → a React element (or null if unavailable).
 * Each renderer receives the full normalizedWeatherData object.
 */
export function renderCard(cardId, weatherData, onFeedback) {
  const { current, airQuality, marine, agri, daily } = weatherData;
  const todayRain = daily?.[0]?.rainProbability ?? 0;

  switch (cardId) {
    case 'aqi': {
      if (!airQuality) return null;
      const b = aqiBadge(airQuality.aqi);
      return (
        <WeatherCard
          key="aqi"
          cardId="aqi"
          title="Air Quality Index"
          icon={Activity}
          value={airQuality.aqi}
          unit="AQI"
          badgeText={b.text}
          badgeSeverity={b.severity}
          insight={
            airQuality.aqi > 150
              ? 'Unhealthy air — wear N95 mask outdoors. Sensitive groups should limit outdoor exposure.'
              : 'Air quality is acceptable for most people today.'
          }
          onFeedback={onFeedback}
        />
      );
    }

    case 'uvIndex': {
      const b = uvBadge(current.uvIndex);
      return (
        <WeatherCard
          key="uvIndex"
          cardId="uvIndex"
          title="UV Index"
          icon={Sun}
          value={current.uvIndex}
          unit="/ 12"
          badgeText={b.text}
          badgeSeverity={b.severity}
          insight={
            current.uvIndex >= 8
              ? 'Peak UV 11 AM–3 PM. Apply SPF 30+ and wear protective clothing.'
              : `UV is ${b.text.toLowerCase()} today. SPF 15 sufficient for short outdoor stays.`
          }
          onFeedback={onFeedback}
        />
      );
    }

    case 'pollen': {
      if (!airQuality?.pollenCount) return null;
      const count = airQuality.pollenCount;
      const level = count < 30 ? 'Low' : count < 70 ? 'Moderate' : 'High';
      const sev   = count < 30 ? 'Green' : count < 70 ? 'Yellow' : 'Red';
      return (
        <WeatherCard
          key="pollen"
          cardId="pollen"
          title="Pollen Count"
          icon={Leaf}
          value={count}
          unit="grains/m³"
          badgeText={level}
          badgeSeverity={sev}
          insight={
            count > 70
              ? 'High pollen levels. Allergy sufferers should take antihistamines before going out.'
              : 'Pollen levels manageable today for most allergy sufferers.'
          }
          onFeedback={onFeedback}
        />
      );
    }

    case 'humidity': {
      const h = current.humidity;
      const b = h >= 85 ? { text: 'Very Humid', sev: 'Orange' }
              : h >= 70 ? { text: 'Humid',      sev: 'Yellow' }
              :           { text: 'Comfortable', sev: 'Green' };
      return (
        <WeatherCard
          key="humidity"
          cardId="humidity"
          title="Humidity"
          icon={Droplets}
          value={h}
          unit="%"
          badgeText={b.text}
          badgeSeverity={b.sev}
          insight={
            h >= 85
              ? 'High humidity increases heat discomfort. Stay hydrated and stay in shade.'
              : 'Humidity is comfortable. Good conditions for outdoor activity.'
          }
          onFeedback={onFeedback}
        />
      );
    }

    case 'wind': {
      const b = windBadge(current.windSpeed);
      return (
        <WeatherCard
          key="wind"
          cardId="wind"
          title="Wind Speed"
          icon={Wind}
          value={current.windSpeed}
          unit="km/h"
          badgeText={`${b.text} · ${current.windDirection}`}
          badgeSeverity={b.severity}
          insight={
            current.windSpeed >= 40
              ? 'Strong winds expected. Secure loose items outdoors; avoid open-top vehicles.'
              : `${b.text} ${current.windDirection} winds. Comfortable outdoor conditions.`
          }
          onFeedback={onFeedback}
        />
      );
    }

    case 'visibility': {
      const b = visiBadge(current.visibility);
      return (
        <WeatherCard
          key="visibility"
          cardId="visibility"
          title="Visibility"
          icon={Eye}
          value={current.visibility}
          unit="km"
          badgeText={b.text}
          badgeSeverity={b.severity}
          insight={
            current.visibility <= 1
              ? 'Dense fog: drive with fog lights, maintain low speed, keep safe distance.'
              : `Visibility is ${current.visibility} km — ${b.text.toLowerCase()} conditions.`
          }
          onFeedback={onFeedback}
        />
      );
    }

    case 'sunrise': {
      return (
        <WeatherCard
          key="sunrise"
          cardId="sunrise"
          title="Sunrise & Sunset"
          icon={Sunrise}
          value={current.sunrise}
          unit=""
          badgeText={`Sunset ${current.sunset}`}
          badgeSeverity="Green"
          insight={`Golden hour starts at ${current.sunrise}. Best light for morning outdoor activities and photography.`}
          onFeedback={onFeedback}
        />
      );
    }

    case 'bestRunningHours': {
      const res = bestRunningHours(weatherData);
      const sev = res.score >= 70 ? 'Green' : res.score >= 45 ? 'Yellow' : 'Orange';
      return (
        <WeatherCard
          key="bestRunningHours"
          cardId="bestRunningHours"
          title="Best Running Window"
          icon={Activity}
          value={res.window}
          unit=""
          badgeText={`Score ${res.score}/100`}
          badgeSeverity={sev}
          insight={res.tip}
          onFeedback={onFeedback}
        />
      );
    }

    case 'rainAlert': {
      const b = rainBadge(todayRain);
      return (
        <WeatherCard
          key="rainAlert"
          cardId="rainAlert"
          title="Rain Probability"
          icon={CloudRain}
          value={todayRain}
          unit="%"
          badgeText={b.text}
          badgeSeverity={b.severity}
          insight={
            todayRain >= 70
              ? 'Carry an umbrella — heavy rain likely today. Check IMD Nowcast for hourly updates.'
              : todayRain >= 40
              ? 'Light showers possible. Keep a raincoat handy just in case.'
              : 'Low rain chance today. No rain gear needed.'
          }
          onFeedback={onFeedback}
        />
      );
    }

    case 'commuteRisk': {
      const res = commuteRisk(weatherData);
      const sevMap = { Low: 'Green', Moderate: 'Yellow', High: 'Orange', Severe: 'Red' };
      return (
        <WeatherCard
          key="commuteRisk"
          cardId="commuteRisk"
          title="Commute Risk"
          icon={Car}
          value={res.level}
          unit=""
          badgeText={res.leaveBy ? res.leaveBy : `${res.level} Risk`}
          badgeSeverity={sevMap[res.level]}
          insight={res.description}
          onFeedback={onFeedback}
        />
      );
    }

    case 'comfortIndex': {
      const res = comfortIndex(weatherData);
      const sevMap = { Excellent: 'Green', Good: 'Green', Moderate: 'Yellow', Poor: 'Red' };
      return (
        <WeatherCard
          key="comfortIndex"
          cardId="comfortIndex"
          title="Outdoor Comfort Index"
          icon={Calendar}
          value={res.score}
          unit="/ 100"
          badgeText={res.label}
          badgeSeverity={sevMap[res.label]}
          insight={res.description}
          onFeedback={onFeedback}
        />
      );
    }

    case 'marine': {
      if (!marine) return null;
      const waveB = marine.waveHeight < 1 ? { text: 'Calm',      sev: 'Green' }
                  : marine.waveHeight < 2 ? { text: 'Moderate',  sev: 'Yellow' }
                  : marine.waveHeight < 3 ? { text: 'Rough',     sev: 'Orange' }
                  :                         { text: 'Very Rough', sev: 'Red' };
      return (
        <WeatherCard
          key="marine"
          cardId="marine"
          title="Sea Wave Height"
          icon={Waves}
          value={marine.waveHeight}
          unit="m"
          badgeText={`${waveB.text} · High tide ${marine.tideHighTime}`}
          badgeSeverity={waveB.sev}
          insight={
            marine.waveHeight >= 2.5
              ? 'Rough seas — swimming and water sports are unsafe. Heed coast guard advisories.'
              : `${waveB.text} waves. Water temp ${marine.waterTemp}°C. ${marine.seaCondition} sea conditions.`
          }
          onFeedback={onFeedback}
        />
      );
    }

    case 'soilMoisture': {
      if (!agri) return null;
      const msev = agri.soilMoisture > 60 ? 'Green' : agri.soilMoisture > 30 ? 'Yellow' : 'Orange';
      return (
        <WeatherCard
          key="soilMoisture"
          cardId="soilMoisture"
          title="Soil Moisture"
          icon={Sprout}
          value={agri.soilMoisture}
          unit="%"
          badgeText={agri.soilMoisture > 60 ? 'Adequate' : agri.soilMoisture > 30 ? 'Low' : 'Critical'}
          badgeSeverity={msev}
          insight={agri.irrigationAdvice}
          onFeedback={onFeedback}
        />
      );
    }

    case 'frostAlert': {
      if (!agri) return null;
      return (
        <WeatherCard
          key="frostAlert"
          cardId="frostAlert"
          title="Frost Risk"
          icon={Thermometer}
          value={agri.frostRisk ? 'Frost Risk' : 'No Frost'}
          unit=""
          badgeText={agri.frostRisk ? 'Alert' : 'Safe'}
          badgeSeverity={agri.frostRisk ? 'Orange' : 'Green'}
          insight={
            agri.frostRisk
              ? 'Frost expected tonight. Cover crops and protect sensitive plants.'
              : `Soil temperature is ${agri.soilTemp}°C. Safe from frost tonight.`
          }
          onFeedback={onFeedback}
        />
      );
    }

    case 'travelAlerts': {
      const hasAlert = weatherData.alerts?.length > 0;
      return (
        <WeatherCard
          key="travelAlerts"
          cardId="travelAlerts"
          title="Travel Weather Alerts"
          icon={Plane}
          value={hasAlert ? weatherData.alerts.length : 0}
          unit={hasAlert ? 'Active Alerts' : 'Alerts'}
          badgeText={hasAlert ? weatherData.alerts[0]?.severity : 'Clear'}
          badgeSeverity={hasAlert ? weatherData.alerts[0]?.severity : 'Green'}
          insight={
            hasAlert
              ? `⚠️ ${weatherData.alerts[0]?.title}. Check before flying or driving to destination.`
              : 'No active weather disruptions for your travel routes today.'
          }
          onFeedback={onFeedback}
        />
      );
    }

    case 'packingSuggestion': {
      const res = packingSuggestion(weatherData);
      const count = res.items.length;
      return (
        <WeatherCard
          key="packingSuggestion"
          cardId="packingSuggestion"
          title="Packing Suggestions"
          icon={Plane}
          value={count > 0 ? `${count} Items` : 'Light Pack'}
          unit=""
          badgeText={count > 0 ? `${count} recommended` : 'No special gear'}
          badgeSeverity={count > 2 ? 'Orange' : count > 0 ? 'Yellow' : 'Green'}
          insight={res.summary}
          onFeedback={onFeedback}
        />
      );
    }

    default:
      return null;
  }
}
