import { useState, useEffect, useCallback } from 'react';
import { Hadith } from '../types';

const STORAGE_KEY = 'bookmarkedHadiths';

export const useBookmarkedHadiths = () => {
  const [bookmarkedHadiths, setBookmarkedHadiths] = useState<Hadith[]>([]);

  useEffect(() => {
    try {
      const storedBookmarks = localStorage.getItem(STORAGE_KEY);
      if (storedBookmarks) {
        setBookmarkedHadiths(JSON.parse(storedBookmarks));
      }
    } catch (error) {
      console.error("Failed to load bookmarked hadiths from localStorage:", error);
    }
  }, []);

  const saveToLocalStorage = (items: Hadith[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save bookmarked hadiths to localStorage:", error);
    }
  };

  const addBookmark = useCallback((hadith: Hadith) => {
    setBookmarkedHadiths(prevBookmarks => {
      const newBookmarks = [hadith, ...prevBookmarks];
      saveToLocalStorage(newBookmarks);
      return newBookmarks;
    });
  }, []);

  const removeBookmark = useCallback((hadithId: number) => {
    setBookmarkedHadiths(prevBookmarks => {
      const newBookmarks = prevBookmarks.filter(h => h.id !== hadithId);
      saveToLocalStorage(newBookmarks);
      return newBookmarks;
    });
  }, []);

  const isBookmarked = useCallback((hadithId: number): boolean => {
    return bookmarkedHadiths.some(h => h.id === hadithId);
  }, [bookmarkedHadiths]);

  return { bookmarkedHadiths, addBookmark, removeBookmark, isBookmarked };
};