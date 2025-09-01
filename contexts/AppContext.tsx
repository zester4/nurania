
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import { View, AppSettings, PrayerTimes, AppContextType } from '../types';
import { useSettings } from '../hooks/useSettings';
import { getUserLocation, getPrayerTimes, getQiblaDirection } from '../services/prayerTimesService';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [practiceVerse, setPracticeVerse] = useState<{ surahNumber: number; ayahNumber: number } | null>(null);
  const { settings, saveSettings } = useSettings();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [isLoadingLocationData, setIsLoadingLocationData] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const lastFetchedDate = useRef<number | null>(null);

  const fetchLocationData = useCallback(async () => {
    setIsLoadingLocationData(true);
    setLocationError(null);
    try {
      const { latitude, longitude } = await getUserLocation();
      const [times, direction] = await Promise.all([
        getPrayerTimes({ latitude, longitude }),
        getQiblaDirection(latitude, longitude),
      ]);
      setPrayerTimes(times);
      setQiblaDirection(direction);
      lastFetchedDate.current = new Date().getDate();
    } catch (err: any) {
      setLocationError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoadingLocationData(false);
    }
  }, []);

  useEffect(() => {
    fetchLocationData(); // Initial fetch on component mount

    // Set up an interval to check for date changes and refetch data daily
    const dateCheckInterval = setInterval(() => {
        if (new Date().getDate() !== lastFetchedDate.current) {
            fetchLocationData();
        }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(dateCheckInterval); // Cleanup interval on unmount
  }, [fetchLocationData]);

  const handleResumePractice = useCallback((surahNumber: number, ayahNumber: number) => {
    setPracticeVerse({ surahNumber, ayahNumber });
    setCurrentView('tajweed');
  }, []);
  
  const value = {
    currentView,
    setCurrentView,
    practiceVerse,
    handleResumePractice,
    settings,
    saveSettings,
    prayerTimes,
    qiblaDirection,
    isLoadingLocationData,
    locationError
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
