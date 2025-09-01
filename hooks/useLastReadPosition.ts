import { useState, useEffect } from 'react';
import { getAllSurahs } from '../services/quranApiService';

const LAST_READ_KEY = 'nuraniaLastReadPosition';

interface LastReadPosition {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
}

// A simple in-memory cache for the surah list to avoid re-fetching
let surahListCache: any[] | null = null;

export const useLastReadPosition = () => {
  const [lastRead, setLastRead] = useState<LastReadPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchLastRead = async () => {
      try {
        const stored = localStorage.getItem(LAST_READ_KEY);
        if (!stored) {
          setIsLoading(false);
          return;
        }
        
        const { surahNumber, ayahNumber } = JSON.parse(stored);
        
        if (!surahListCache) {
           surahListCache = await getAllSurahs();
        }
        
        const surahInfo = surahListCache.find(s => s.surahNumber === surahNumber);
        
        if (isMounted) {
          setLastRead({
            surahNumber,
            ayahNumber,
            surahName: surahInfo?.surahName || 'Unknown Surah'
          });
        }

      } catch (error) {
        console.error("Failed to load last read position:", error);
      } finally {
        if (isMounted) {
            setIsLoading(false);
        }
      }
    };

    fetchLastRead();
    
    return () => { isMounted = false; };
  }, []);

  return { lastRead, isLoading };
};
