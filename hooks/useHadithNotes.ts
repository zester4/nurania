import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'nuraniaHadithNotes';

type HadithNotes = Record<number, string>; // Key is Hadith ID, value is the note text

export const useHadithNotes = () => {
  const [notes, setNotes] = useState<HadithNotes>({});

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem(STORAGE_KEY);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error("Failed to load Hadith notes from localStorage:", error);
    }
  }, []);

  const saveNotesToStorage = (updatedNotes: HadithNotes) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (error) {
      console.error("Failed to save Hadith notes to localStorage:", error);
    }
  };

  const getNote = useCallback((hadithId: number): string | undefined => {
    return notes[hadithId];
  }, [notes]);

  const saveNote = useCallback((hadithId: number, noteText: string) => {
    setNotes(currentNotes => {
      // If noteText is empty after trimming, remove the note to keep storage clean
      if (!noteText.trim()) {
        const { [hadithId]: _, ...remainingNotes } = currentNotes;
        saveNotesToStorage(remainingNotes);
        return remainingNotes;
      }
      // Otherwise, save or update the note
      const newNotes = { ...currentNotes, [hadithId]: noteText };
      saveNotesToStorage(newNotes);
      return newNotes;
    });
  }, []);

  return { getNote, saveNote };
};
