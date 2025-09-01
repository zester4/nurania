import { useState, useEffect } from 'react';

const STORAGE_KEY = 'nuraniaLastLearningPath';

interface LastLearningPath {
  topicId: string;
  topicTitle: string;
}

export const useLastLearningPath = () => {
  const [lastLearningPath, setLastLearningPath] = useState<LastLearningPath | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLastLearningPath(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load last learning path from localStorage:", error);
    }
  }, []);

  const saveLastLearningPath = (topicId: string, topicTitle: string) => {
    const data: LastLearningPath = { topicId, topicTitle };
    setLastLearningPath(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save last learning path to localStorage:", error);
    }
  };

  return { lastLearningPath, saveLastLearningPath };
};
