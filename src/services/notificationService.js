/**
 * Push Notification Service (FCM-Ready Stub)
 * Evaluates severe weather alerts and manages notification preferences.
 */

const STORAGE_KEY = 'mausam_notification_settings';

const DEFAULT_SETTINGS = {
  enabled: true,
  minSeverity: 'Orange', // 'Yellow' | 'Orange' | 'Red'
  soundEnabled: true
};

/**
 * Get notification settings from localStorage.
 */
export function getNotificationSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save notification settings to localStorage.
 * @param {object} settings
 */
export function saveNotificationSettings(settings) {
  try {
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save notification settings:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Check browser notification permission status.
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

/**
 * Severity hierarchy mapping for threshold checks.
 */
const SEVERITY_WEIGHT = {
  Green: 0,
  Yellow: 1,
  Orange: 2,
  Red: 3
};

/**
 * Format standard FCM/Web-Push notification payload from an IMD alert.
 * @param {import('../data/types').WeatherAlert} alert
 * @param {string} locationName
 */
export function formatNotificationPayload(alert, locationName = 'Your location') {
  if (!alert) return null;

  const severityEmoji = {
    Red: '🔴 SEVERE WEATHER WARNING',
    Orange: '🟠 WEATHER ADVISORY',
    Yellow: '🟡 WEATHER WATCH',
    Green: '🟢 WEATHER UPDATE'
  }[alert.severity] || '⚠️ WEATHER ALERT';

  return {
    title: `${severityEmoji}: ${alert.title}`,
    body: `${locationName}: ${alert.description}`,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      alertId: alert.id,
      severity: alert.severity,
      issuedAt: alert.issuedAt,
      validUntil: alert.validUntil,
      location: locationName
    }
  };
}

/**
 * Pure function: Evaluate whether a notification should trigger given weather alerts and user settings.
 * @param {import('../data/types').NormalizedWeatherData} weatherData
 * @param {object} [userSettings]
 * @returns {{ shouldNotify: boolean, payload: object|null }}
 */
export function evaluateNotificationTrigger(weatherData, userSettings) {
  const settings = userSettings || getNotificationSettings();
  if (!settings.enabled) {
    return { shouldNotify: false, payload: null };
  }

  const alerts = weatherData?.alerts || [];
  if (alerts.length === 0) {
    return { shouldNotify: false, payload: null };
  }

  const minWeight = SEVERITY_WEIGHT[settings.minSeverity] ?? 2; // Default to Orange
  const severeAlert = alerts.find(a => (SEVERITY_WEIGHT[a.severity] ?? 0) >= minWeight);

  if (!severeAlert) {
    return { shouldNotify: false, payload: null };
  }

  const payload = formatNotificationPayload(severeAlert, weatherData.location?.name);
  return { shouldNotify: true, payload };
}
