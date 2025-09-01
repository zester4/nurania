import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import { View, AppSettings, PrayerTimes, AppContextType, Chapter, DailyChallengeState } from '../types';
import { useSettings } from '../hooks/useSettings';
import { getUserLocation, getPrayerTimes, getQiblaDirection } from '../services/prayerTimesService';
import { useDailyChallenges } from '../hooks/useDailyChallenges';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [practiceVerse, setPracticeVerse] = useState<{ surahNumber: number; ayahNumber: number } | null>(null);
  const [gotoVerse, setGotoVerse] = useState<{ surahNumber: number; ayahNumber: number } | null>(null);
  const [gotoHadith, setGotoHadith] = useState<{ bookSlug: string; chapter: Chapter } | null>(null);
  const [gotoLearningPath, setGotoLearningPath] = useState<{ topicId: string } | null>(null);

  const { settings, saveSettings } = useSettings();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [isLoadingLocationData, setIsLoadingLocationData] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const { dailyChallengeState, logChallengeAction } = useDailyChallenges();

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

    const dateCheckInterval = setInterval(() => {
        if (new Date().getDate() !== lastFetchedDate.current) {
            fetchLocationData();
        }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(dateCheckInterval);
  }, [fetchLocationData]);

  const handleResumePractice = useCallback((surahNumber: number, ayahNumber: number) => {
    setPracticeVerse({ surahNumber, ayahNumber });
    setCurrentView('tajweed');
  }, []);
  
  const handleGotoVerse = useCallback((surahNumber: number, ayahNumber: number) => {
    setGotoVerse({ surahNumber, ayahNumber });
    setCurrentView('read');
  }, []);
  
  const handleGotoHadith = useCallback((bookSlug: string, chapter: Chapter) => {
    setGotoHadith({ bookSlug, chapter });
    setCurrentView('library');
  }, []);

  const handleGotoLearningPath = useCallback((topicId: string) => {
    setGotoLearningPath({ topicId });
    setCurrentView('learning');
  }, []);

  const clearPracticeVerse = useCallback(() => setPracticeVerse(null), []);
  const clearGotoVerse = useCallback(() => setGotoVerse(null), []);
  const clearGotoHadith = useCallback(() => setGotoHadith(null), []);
  const clearGotoLearningPath = useCallback(() => setGotoLearningPath(null), []);

  const value: AppContextType = {
    currentView,
    setCurrentView,
    practiceVerse,
    handleResumePractice,
    clearPracticeVerse,
    gotoVerse,
    handleGotoVerse,
    clearGotoVerse,
    gotoHadith,
    handleGotoHadith,
    clearGotoHadith,
    gotoLearningPath,
    handleGotoLearningPath,
    clearGotoLearningPath,
    settings,
    saveSettings,
    prayerTimes,
    qiblaDirection,
    isLoadingLocationData,
    locationError,
    dailyChallengeState,
    logChallengeAction
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
