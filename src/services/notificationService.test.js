import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNotificationSettings,
  saveNotificationSettings,
  formatNotificationPayload,
  evaluateNotificationTrigger
} from './notificationService';

const sampleWeatherDataWithAlert = {
  location: { name: 'Noida' },
  alerts: [
    {
      id: 'alt-orange-1',
      title: 'Dense Fog Advisory',
      severity: 'Orange',
      description: 'Visibility below 200m expected early morning.',
      issuedAt: '2026-09-28T20:00:00Z',
      validUntil: '2026-09-29T08:00:00Z'
    }
  ]
};

const sampleWeatherDataWithRedAlert = {
  location: { name: 'Mumbai' },
  alerts: [
    {
      id: 'alt-red-1',
      title: 'Extremely Heavy Rainfall Warning',
      severity: 'Red',
      description: 'Extremely heavy rainfall > 204.4mm expected.',
      issuedAt: '2026-09-28T20:00:00Z',
      validUntil: '2026-09-29T12:00:00Z'
    }
  ]
};

describe('Notification Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default settings when none are saved', () => {
    const settings = getNotificationSettings();
    expect(settings.enabled).toBe(true);
    expect(settings.minSeverity).toBe('Orange');
  });

  it('persists and retrieves updated settings', () => {
    saveNotificationSettings({ minSeverity: 'Yellow', soundEnabled: false });
    const settings = getNotificationSettings();
    expect(settings.minSeverity).toBe('Yellow');
    expect(settings.soundEnabled).toBe(false);
  });

  it('formats notification payload correctly for an alert', () => {
    const payload = formatNotificationPayload(sampleWeatherDataWithAlert.alerts[0], 'Noida');
    expect(payload.title).toContain('WEATHER ADVISORY');
    expect(payload.title).toContain('Dense Fog Advisory');
    expect(payload.body).toContain('Noida: Visibility below 200m');
    expect(payload.data.severity).toBe('Orange');
  });

  it('evaluates notification trigger for Orange alert with default settings (minSeverity Orange)', () => {
    const result = evaluateNotificationTrigger(sampleWeatherDataWithAlert);
    expect(result.shouldNotify).toBe(true);
    expect(result.payload.data.alertId).toBe('alt-orange-1');
  });

  it('evaluates notification trigger as false when alerts are below user minSeverity threshold', () => {
    const result = evaluateNotificationTrigger(sampleWeatherDataWithAlert, {
      enabled: true,
      minSeverity: 'Red'
    });
    expect(result.shouldNotify).toBe(false);
    expect(result.payload).toBeNull();
  });

  it('triggers for Red alert even when minSeverity is set to Red', () => {
    const result = evaluateNotificationTrigger(sampleWeatherDataWithRedAlert, {
      enabled: true,
      minSeverity: 'Red'
    });
    expect(result.shouldNotify).toBe(true);
    expect(result.payload.data.severity).toBe('Red');
  });

  it('returns false if notifications are disabled in user settings', () => {
    const result = evaluateNotificationTrigger(sampleWeatherDataWithRedAlert, {
      enabled: false,
      minSeverity: 'Yellow'
    });
    expect(result.shouldNotify).toBe(false);
  });
});
