import { useState, useEffect, useCallback } from 'react';
import { RecitationHistoryItem } from '../types';

const STORAGE_KEY = 'recitationHistory';

export const useRecitationHistory = () => {
  const [history, setHistory] = useState<RecitationHistoryItem[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load recitation history from localStorage:", error);
    }
  }, []);

  const addHistoryItem = useCallback((item: RecitationHistoryItem) => {
    setHistory(prevHistory => {
      // Keep the list to a reasonable size, e.g., 50 items
      const newHistory = [item, ...prevHistory].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error("Failed to save recitation history to localStorage:", error);
      }
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    if (window.confirm("Are you sure you want to clear your entire recitation history? This cannot be undone.")) {
      setHistory([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error("Failed to clear recitation history from localStorage:", error);
      }
    }
  }, []);

  return { history, addHistoryItem, clearHistory };
};
