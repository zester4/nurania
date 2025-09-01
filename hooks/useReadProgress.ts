import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'quranReadProgress';

// Type for the progress data: { surahNumber: [ayahNumber1, ayahNumber2, ...] }
type ReadProgress = Record<number, number[]>;

export const useReadProgress = () => {
  const [progress, setProgress] = useState<ReadProgress>({});

  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem(STORAGE_KEY);
      if (storedProgress) {
        setProgress(JSON.parse(storedProgress));
      }
    } catch (error) {
      console.error("Failed to load Quran read progress from localStorage:", error);
    }
  }, []);

  const saveProgress = (newProgress: ReadProgress) => {
    setProgress(newProgress);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
    } catch (error) {
      console.error("Failed to save Quran read progress to localStorage:", error);
    }
  };

  const toggleVerseRead = useCallback((surahNumber: number, ayahNumber: number) => {
    setProgress(currentProgress => {
      const surahProgress = currentProgress[surahNumber] ? [...currentProgress[surahNumber]] : [];
      const verseIndex = surahProgress.indexOf(ayahNumber);
      
      if (verseIndex > -1) {
        // Verse is already read, so unread it
        surahProgress.splice(verseIndex, 1);
      } else {
        // Verse is not read, so read it
        surahProgress.push(ayahNumber);
      }

      const newProgress = {
        ...currentProgress,
        [surahNumber]: surahProgress,
      };
      
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const isVerseRead = (surahNumber: number, ayahNumber: number): boolean => {
    return progress[surahNumber]?.includes(ayahNumber) ?? false;
  };

  const markAllVersesRead = useCallback((surahNumber: number, totalVerses: number) => {
    const allVerses = Array.from({ length: totalVerses }, (_, i) => i + 1);
    const newProgress = { ...progress, [surahNumber]: allVerses };
    saveProgress(newProgress);
  }, [progress]);
  
  const markAllVersesUnread = useCallback((surahNumber: number) => {
    const newProgress = { ...progress, [surahNumber]: [] };
    saveProgress(newProgress);
  }, [progress]);

  const getSurahProgress = (surahNumber: number, totalVerses: number): number => {
    if (totalVerses === 0) return 0;
    const readCount = progress[surahNumber]?.length ?? 0;
    return Math.round((readCount / totalVerses) * 100);
  };

  return {
    progress,
    toggleVerseRead,
    isVerseRead,
    markAllVersesRead,
    markAllVersesUnread,
    getSurahProgress,
  };
};
