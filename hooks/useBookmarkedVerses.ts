import { useState, useEffect, useCallback } from 'react';
import { BookmarkedVerse } from '../types';

const STORAGE_KEY = 'bookmarkedVerses';

export const useBookmarkedVerses = () => {
  const [bookmarkedVerses, setBookmarkedVerses] = useState<BookmarkedVerse[]>([]);

  useEffect(() => {
    try {
      const storedBookmarks = localStorage.getItem(STORAGE_KEY);
      if (storedBookmarks) {
        setBookmarkedVerses(JSON.parse(storedBookmarks));
      }
    } catch (error) {
      console.error("Failed to load bookmarked verses from localStorage:", error);
    }
  }, []);

  const saveToLocalStorage = (items: BookmarkedVerse[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save bookmarked verses to localStorage:", error);
    }
  };

  const addBookmark = useCallback((verse: BookmarkedVerse) => {
    setBookmarkedVerses(prevBookmarks => {
      // Avoid duplicates
      if (prevBookmarks.some(b => b.surahNumber === verse.surahNumber && b.ayahNumber === verse.ayahNumber)) {
        return prevBookmarks;
      }
      const newBookmarks = [verse, ...prevBookmarks];
      saveToLocalStorage(newBookmarks);
      return newBookmarks;
    });
  }, []);

  const removeBookmark = useCallback((surahNumber: number, ayahNumber: number) => {
    setBookmarkedVerses(prevBookmarks => {
      const newBookmarks = prevBookmarks.filter(b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber));
      saveToLocalStorage(newBookmarks);
      return newBookmarks;
    });
  }, []);

  const isBookmarked = useCallback((surahNumber: number, ayahNumber: number): boolean => {
    return bookmarkedVerses.some(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber);
  }, [bookmarkedVerses]);

  return { bookmarkedVerses, addBookmark, removeBookmark, isBookmarked };
};
