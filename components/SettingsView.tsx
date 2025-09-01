
import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';
import { useRecitationHistory } from '../hooks/useRecitationHistory';
import { useAppContext } from '../contexts/AppContext';

const SettingsView: React.FC = () => {
  const { settings, saveSettings } = useAppContext();
  const { clearHistory } = useRecitationHistory();
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  // This effect synchronizes the app's settings with the browser's actual permission status.
  // If a user revokes permission from the browser settings, the app's toggle will turn off.
  useEffect(() => {
    if (notificationPermission === 'denied' && settings.notificationsEnabled) {
      saveSettings({ notificationsEnabled: false });
    }
  }, [notificationPermission, settings.notificationsEnabled, saveSettings]);

  const handleToggle = () => {
    // Logic for turning notifications ON
    if (!settings.notificationsEnabled) {
      if (notificationPermission === 'granted') {
        saveSettings({ notificationsEnabled: true });
      } else if (notificationPermission === 'default') {
        // Request permission if it hasn't been asked before
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission); // Update state with the user's choice
          if (permission === 'granted') {
            saveSettings({ notificationsEnabled: true });
          }
        });
      } else { // 'denied'
        alert("Notification permission has been denied. Please enable it in your browser or operating system settings to use this feature.");
      }
    } else {
      // Logic for turning notifications OFF (no permission check needed)
      saveSettings({ notificationsEnabled: false });
    }
  };
  
  const handleQuietHoursToggle = () => {
    saveSettings({
      quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled },
    });
  };

  const handleQuietHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    saveSettings({
      quietHours: { ...settings.quietHours, [e.target.name]: e.target.value },
    });
  };
  
  const handleSoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      saveSettings({ notificationSound: e.target.value as 'default' | 'adhan' });
  }

  return (
    <div className="space-y-6 overflow-y-auto p-1 h-full">
      <Card>
        <h2 className="text-xl font-semibold text-islamic-green-dark mb-1">Settings</h2>
        <p className="text-stone-600">Manage your application preferences.</p>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-islamic-green-dark mb-4">Prayer Notifications</h3>
        <div className="space-y-4">
          {/* Enable/Disable Notifications */}
          <div className="flex items-center justify-between">
            <label htmlFor="notifications-enabled" className="font-medium text-stone-700">Enable Prayer Time Alerts</label>
            <button
              id="notifications-enabled"
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notificationsEnabled ? 'bg-islamic-green' : 'bg-stone-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notification Sound */}
          <div className="flex items-center justify-between">
            <label htmlFor="notification-sound" className="font-medium text-stone-700">Notification Sound</label>
            <select
              id="notification-sound"
              value={settings.notificationSound}
              onChange={handleSoundChange}
              disabled={!settings.notificationsEnabled}
              className="p-2 bg-stone-50 border border-stone-300 rounded-lg focus:border-islamic-green focus:ring-1 focus:ring-islamic-green transition disabled:opacity-50"
            >
              <option value="default">Default Beep</option>
              <option value="adhan">Adhan</option>
            </select>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
             <div className="flex items-center justify-between">
                <label htmlFor="quiet-hours-enabled" className="font-medium text-stone-700">Quiet Hours (Do Not Disturb)</label>
                <button
                    id="quiet-hours-enabled"
                    onClick={handleQuietHoursToggle}
                    disabled={!settings.notificationsEnabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.quietHours.enabled ? 'bg-islamic-green' : 'bg-stone-300'
                    } disabled:opacity-50`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>
            {settings.quietHours.enabled && (
                <div className="flex items-center justify-between pl-4">
                     <p className="text-sm text-stone-600">Silence notifications between:</p>
                    <div className="flex items-center space-x-2">
                        <input
                            type="time"
                            name="start"
                            value={settings.quietHours.start}
                            onChange={handleQuietHoursChange}
                            disabled={!settings.notificationsEnabled}
                            className="p-2 bg-stone-50 border border-stone-300 rounded-lg focus:border-islamic-green focus:ring-1 focus:ring-islamic-green transition disabled:opacity-50"
                        />
                        <span>and</span>
                        <input
                            type="time"
                            name="end"
                            value={settings.quietHours.end}
                            onChange={handleQuietHoursChange}
                            disabled={!settings.notificationsEnabled}
                            className="p-2 bg-stone-50 border border-stone-300 rounded-lg focus:border-islamic-green focus:ring-1 focus:ring-islamic-green transition disabled:opacity-50"
                        />
                    </div>
                </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-islamic-green-dark mb-4">Data Management</h3>
        <div className="flex items-center justify-between">
            <p className="text-stone-700">Clear your recitation practice history.</p>
            <button
                onClick={clearHistory}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 hover:text-red-800 transition-colors"
            >
                Clear History
            </button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsView;
