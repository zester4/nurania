import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../types';

const STORAGE_KEY = 'nuraniaAppSettings';

const defaultSettings: AppSettings = {
  notificationsEnabled: false,
  notificationSound: 'default',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '06:00',
  },
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        // Merge stored settings with defaults to ensure all keys are present
        return { ...defaultSettings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
    }
    return defaultSettings;
  });

  const saveSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      } catch (error)
      {
        console.error("Failed to save settings to localStorage:", error);
      }
      return updatedSettings;
    });
  }, []);

  return { settings, saveSettings };
};
