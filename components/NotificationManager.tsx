
import { useEffect, useRef, useCallback } from 'react';
import { AppSettings, PrayerTimes } from '../types';
import { useAppContext } from '../contexts/AppContext';

// Helper function to parse "HH:mm" string into a Date object for today
const parseTime = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Helper to check if the current time falls within the quiet hours
const isDuringQuietHours = (time: Date, quietHours: AppSettings['quietHours']): boolean => {
    if (!quietHours.enabled) return false;

    const start = parseTime(quietHours.start);
    const end = parseTime(quietHours.end);

    if (start > end) { // Overnight quiet hours (e.g., 22:00 to 06:00)
        return time >= start || time < end;
    } else { // Same-day quiet hours (e.g., 09:00 to 17:00)
        return time >= start && time < end;
    }
};

const ADHAN_URL = 'https://www.islamicity.org/media/radio/athans/Athan_Makkah.mp3';

const NotificationManager: React.FC = () => {
  const { settings, prayerTimes } = useAppContext();
  const timeoutRef = useRef<number | null>(null);

  const scheduleNextNotification = useCallback(() => {
    // Clear any existing timer before scheduling a new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Exit if notifications are disabled, prayer times aren't available, or permission isn't granted
    if (!prayerTimes || !settings.notificationsEnabled || Notification.permission !== 'granted') {
      return;
    }

    const now = new Date();

    // Find all upcoming prayer times for today
    const upcomingPrayers = Object.entries(prayerTimes)
      .map(([name, time]) => ({ name, date: parseTime(time) }))
      .filter(prayer => prayer.date > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // If there is an upcoming prayer today, schedule it
    if (upcomingPrayers.length > 0) {
      const nextPrayer = upcomingPrayers[0];
      const timeUntilNextPrayer = nextPrayer.date.getTime() - now.getTime();

      timeoutRef.current = window.setTimeout(() => {
        // Re-check quiet hours right before sending the notification
        if (!isDuringQuietHours(new Date(), settings.quietHours)) {
          // Play sound if applicable
          if (settings.notificationSound === 'adhan') {
            const adhanAudio = new Audio(ADHAN_URL);
            adhanAudio.play().catch(e => console.error("Error playing Adhan:", e));
          }
          
          // Show the notification
          new Notification('Prayer Time Reminder', {
            body: `It's time for ${nextPrayer.name} prayer.`,
            icon: '/icon.png', // Optional: Replace with a real icon path
          });
        }
        // After the notification (or quiet-hour skip), schedule the next one
        scheduleNextNotification();
      }, timeUntilNextPrayer);
    }
    // If no prayers are left today, the AppContext daily fetch will provide new times for tomorrow,
    // which will re-trigger this scheduling logic.
  }, [prayerTimes, settings]);

  useEffect(() => {
    scheduleNextNotification();

    // Cleanup function to clear the timer on component unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [scheduleNextNotification]);

  return null; // This component does not render anything
};

export default NotificationManager;
