import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'nuraniaLearningProgress';

// Progress data structure: { pathTopicId: [completedStepId1, completedStepId2, ...] }
type LearningProgress = Record<string, string[]>;

export const useLearningProgress = () => {
  const [progress, setProgress] = useState<LearningProgress>({});

  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem(STORAGE_KEY);
      if (storedProgress) {
        setProgress(JSON.parse(storedProgress));
      }
    } catch (error) {
      console.error("Failed to load learning progress from localStorage:", error);
    }
  }, []);

  const saveProgress = (newProgress: LearningProgress) => {
    setProgress(newProgress);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
    } catch (error) {
      console.error("Failed to save learning progress to localStorage:", error);
    }
  };

  const toggleStepCompletion = useCallback((pathId: string, stepId: string) => {
    setProgress(currentProgress => {
      const pathProgress = currentProgress[pathId] ? [...currentProgress[pathId]] : [];
      const stepIndex = pathProgress.indexOf(stepId);

      if (stepIndex > -1) {
        // Step is complete, so mark as incomplete
        pathProgress.splice(stepIndex, 1);
      } else {
        // Step is incomplete, so mark as complete
        pathProgress.push(stepId);
      }

      const newProgress = { ...currentProgress, [pathId]: pathProgress };
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const isStepComplete = (pathId: string, stepId: string): boolean => {
    return progress[pathId]?.includes(stepId) ?? false;
  };

  const getPathProgress = (pathId: string, totalSteps: number): number => {
    if (totalSteps === 0) return 0;
    const completedCount = progress[pathId]?.length ?? 0;
    return Math.round((completedCount / totalSteps) * 100);
  };

  return { progress, toggleStepCompletion, isStepComplete, getPathProgress };
};