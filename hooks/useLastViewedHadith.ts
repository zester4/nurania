import { useState, useEffect } from 'react';
import { LastViewedHadith } from '../types';
import { HADITH_BOOKS } from '../constants';

const STORAGE_KEY = 'nuraniaLastViewedHadith';

export const useLastViewedHadith = () => {
  const [lastViewedHadith, setLastViewedHadith] = useState<LastViewedHadith | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLastViewedHadith(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load last viewed Hadith from localStorage:", error);
    }
  }, []);

  const saveLastViewedHadith = (bookSlug: string, chapter: any) => {
    const book = HADITH_BOOKS.find(b => b.slug === bookSlug);
    if (book) {
      const data: LastViewedHadith = {
        bookSlug,
        bookName: book.name,
        chapter,
      };
      setLastViewedHadith(data);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to save last viewed Hadith to localStorage:", error);
      }
    }
  };

  return { lastViewedHadith, saveLastViewedHadith };
};