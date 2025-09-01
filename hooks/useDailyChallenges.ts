import { useState, useEffect, useCallback } from 'react';
import { Challenge, ChallengeType, DailyChallengeState } from '../types';

const STORAGE_KEY = 'nuraniaDailyChallenges';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const allChallenges: Omit<Challenge, 'progress' | 'completed' | 'id'>[] = [
    { type: 'readVerses', description: 'Read 5 verses in the Quran', target: 5 },
    { type: 'practiceAyah', description: 'Practice reciting 1 Ayah', target: 1 },
    { type: 'bookmarkVerse', description: 'Bookmark a new verse', target: 1 },
    { type: 'completeLearningStep', description: 'Complete a step in a Learning Path', target: 1 },
];

const generateNewChallenges = (): Challenge[] => {
    const shuffled = [...allChallenges].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map((c, i) => ({
        ...c,
        id: `${c.type}-${i}`,
        progress: 0,
        completed: false,
    }));
};

export const useDailyChallenges = () => {
    const [state, setState] = useState<DailyChallengeState>({
        challenges: [],
        streak: 0,
        lastUpdate: getTodayDateString(),
    });

    useEffect(() => {
        let storedState: DailyChallengeState | null = null;
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                storedState = JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to parse daily challenges from storage", e);
        }

        const today = new Date();
        const todayStr = getTodayDateString();
        
        if (storedState) {
            const lastUpdateDate = new Date(storedState.lastUpdate);
            
            const todayAtMidnight = new Date(today);
            todayAtMidnight.setHours(0, 0, 0, 0);
            lastUpdateDate.setHours(0, 0, 0, 0);

            const diffDays = Math.round((todayAtMidnight.getTime() - lastUpdateDate.getTime()) / (1000 * 3600 * 24));

            if (diffDays === 0) {
                // Same day, just load the state
                setState(storedState);
            } else {
                // New day, check if streak should be reset
                const allCompletedOnLastDay = storedState.challenges.every(c => c.completed);
                let newStreak = storedState.streak;

                if (!allCompletedOnLastDay || diffDays > 1) {
                    newStreak = 0; // Reset streak if goals weren't met or a day was skipped
                }
                
                const newState = {
                    challenges: generateNewChallenges(),
                    streak: newStreak,
                    lastUpdate: todayStr,
                };
                setState(newState);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
            }
        } else {
            // No stored state, first time setup
            const initialState = {
                challenges: generateNewChallenges(),
                streak: 0,
                lastUpdate: todayStr,
            };
            setState(initialState);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
        }
    }, []);

    const logChallengeAction = useCallback((type: ChallengeType, amount = 1) => {
        setState(prevState => {
            // Don't update if it's not today's challenges
            if (prevState.lastUpdate !== getTodayDateString()) {
                return prevState;
            }

            const wasAlreadyComplete = prevState.challenges.every(c => c.completed);
            
            let hasChanged = false;
            const newChallenges = prevState.challenges.map(challenge => {
                if (challenge.type === type && !challenge.completed) {
                    hasChanged = true;
                    const newProgress = Math.min(challenge.target, challenge.progress + amount);
                    return {
                        ...challenge,
                        progress: newProgress,
                        completed: newProgress >= challenge.target,
                    };
                }
                return challenge;
            });

            if (hasChanged) {
                const isNowComplete = newChallenges.every(c => c.completed);
                // Increment streak only when transitioning from incomplete to complete
                const newStreak = isNowComplete && !wasAlreadyComplete 
                    ? prevState.streak + 1 
                    : prevState.streak;

                const newState = { 
                    ...prevState, 
                    challenges: newChallenges,
                    streak: newStreak,
                 };

                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
                } catch (e) {
                    console.error("Failed to save daily challenges state", e);
                }
                return newState;
            }
            return prevState;
        });
    }, []);

    return { dailyChallengeState: state, logChallengeAction };
};