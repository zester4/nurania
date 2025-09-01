import React, { useState, useEffect } from 'react';
import { LearningPath, LearningPathTopic, LearningStep } from '../types';
import { generateLearningPath } from '../services/geminiService';
import { LEARNING_PATH_TOPICS } from '../constants';
import { Card } from './common/Card';
import { Loader } from './common/Loader';
import { SkeletonLoader } from './common/SkeletonLoader';
import { useAppContext } from '../contexts/AppContext';
import { useLearningProgress } from '../hooks/useLearningProgress';
import { useLastLearningPath } from '../hooks/useLastLearningPath';
import { CheckCircleIcon, CheckCircleFilledIcon, BookOpenIcon } from './common/IconButton';
import { VerseModal } from './common/VerseModal';

const LearningView: React.FC = () => {
    const { logChallengeAction, gotoLearningPath, clearGotoLearningPath } = useAppContext();
    const [selectedTopic, setSelectedTopic] = useState<LearningPathTopic | null>(null);
    const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVerseModalOpen, setIsVerseModalOpen] = useState(false);
    const [selectedVerse, setSelectedVerse] = useState<{ surah: number, ayah: number} | null>(null);
    
    const { isStepComplete, toggleStepCompletion, getPathProgress } = useLearningProgress();
    const { saveLastLearningPath } = useLastLearningPath();

    const handleSelectTopic = async (topic: LearningPathTopic) => {
        setSelectedTopic(topic);
        setIsLoading(true);
        setError(null);
        setLearningPath(null);
        try {
            const path = await generateLearningPath(topic.title);
            setLearningPath(path);
            saveLastLearningPath(topic.id, topic.title);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (gotoLearningPath) {
            const topicToLoad = LEARNING_PATH_TOPICS.find(t => t.id === gotoLearningPath.topicId);
            if (topicToLoad) {
                handleSelectTopic(topicToLoad);
            }
            clearGotoLearningPath();
        }
    }, [gotoLearningPath, clearGotoLearningPath]);


    const handleStepToggle = (pathId: string, stepId: string) => {
        if (!isStepComplete(pathId, stepId)) {
            logChallengeAction('completeLearningStep');
        }
        toggleStepCompletion(pathId, stepId);
    };

    const handleOpenVerseModal = (surah: number, ayah: number) => {
        setSelectedVerse({ surah, ayah });
        setIsVerseModalOpen(true);
    };

    const TopicSelectionView = () => (
        <Card>
            <h2 className="text-xl font-semibold text-islamic-green-dark mb-2">Guided Study Paths</h2>
            <p className="text-stone-600 mb-6">Choose a topic to begin a personalized learning journey curated by AI.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LEARNING_PATH_TOPICS.map(topic => (
                    <button key={topic.id} onClick={() => handleSelectTopic(topic)} className="p-4 bg-stone-50 hover:bg-islamic-gold-light/40 border border-stone-200 rounded-lg text-left transition-colors">
                        <span className="text-2xl">{topic.icon}</span>
                        <h3 className="font-bold text-stone-800 mt-2">{topic.title}</h3>
                        <p className="text-sm text-stone-600">{topic.description}</p>
                    </button>
                ))}
            </div>
        </Card>
    );

    const LearningPathView = () => {
        if (!learningPath || !selectedTopic) return null;

        const pathProgress = getPathProgress(selectedTopic.id, learningPath.steps.length);

        return (
            <Card>
                <button onClick={() => setSelectedTopic(null)} className="text-sm font-medium text-islamic-green-dark hover:underline mb-4">&larr; Back to Topics</button>
                <h2 className="text-2xl font-bold text-islamic-green-dark">{learningPath.topic}</h2>
                <p className="text-stone-600 mt-1 mb-6">{learningPath.introduction}</p>

                <div className="mb-6 space-y-2">
                    <div className="flex justify-between items-center"><span className="text-sm font-medium text-stone-600">Progress</span><span className="text-sm font-bold text-islamic-green-dark">{pathProgress}%</span></div>
                    <div className="w-full bg-stone-200 rounded-full h-2.5"><div className="bg-islamic-green h-2.5 rounded-full transition-all duration-500" style={{ width: `${pathProgress}%` }}></div></div>
                </div>

                <div className="space-y-4">
                    {learningPath.steps.map((step, index) => (
                        <StepCard key={step.id} step={step} pathId={selectedTopic.id} onToggle={() => handleStepToggle(selectedTopic.id, step.id)} onOpenVerse={handleOpenVerseModal} index={index} />
                    ))}
                </div>
            </Card>
        );
    };

    const StepCard: React.FC<{ step: LearningStep, pathId: string, onToggle: () => void, onOpenVerse: (s: number, a: number) => void, index: number }> = ({ step, pathId, onToggle, onOpenVerse, index }) => {
        const completed = isStepComplete(pathId, step.id);
        const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
        
        const handleActionClick = () => {
            if (step.type === 'quran' && step.reference.surah && step.reference.ayah) {
                onOpenVerse(step.reference.surah, step.reference.ayah);
            }
        };

        return (
            <div className={`p-4 rounded-lg border transition-all ${completed ? 'bg-islamic-green/10 border-islamic-green/30' : 'bg-stone-50 border-stone-200'}`}>
                <div className="flex items-start">
                    <button onClick={onToggle} className="mr-4 mt-1 flex-shrink-0">
                        {completed ? <CheckCircleFilledIcon className="w-6 h-6 text-islamic-green" /> : <CheckCircleIcon className="w-6 h-6 text-stone-400" />}
                    </button>
                    <div className="flex-grow">
                        <h4 className="font-bold text-stone-800">{index + 1}. {step.title}</h4>
                        <p className="text-stone-600 mt-1">{step.content}</p>

                        {step.type === 'quran' && <button onClick={handleActionClick} className="flex items-center space-x-2 text-sm font-semibold text-islamic-green hover:underline mt-3"><BookOpenIcon className="w-4 h-4" /><span>Read Verse</span></button>}
                    
                        {step.type === 'quiz' && step.quiz && (
                             <div className="mt-4 space-y-2">
                                <p className="font-semibold text-stone-700">{step.quiz.question}</p>
                                {step.quiz.options.map((option, idx) => {
                                    const isSelected = quizAnswer === idx;
                                    const isCorrect = step.quiz.correctAnswerIndex === idx;
                                    
                                    let buttonClass = 'w-full text-left p-2 rounded-md border';
                                    if (quizAnswer !== null) { // an answer has been selected
                                        if (isSelected && !isCorrect) buttonClass += ' bg-red-100 border-red-300 text-red-800';
                                        else if (isCorrect) buttonClass += ' bg-green-100 border-green-300 text-green-800';
                                        else buttonClass += ' bg-stone-100 border-stone-200 text-stone-500';
                                    } else {
                                        buttonClass += ' bg-white hover:bg-stone-100 border-stone-300';
                                    }

                                    return (<button key={idx} onClick={() => setQuizAnswer(idx)} disabled={quizAnswer !== null} className={buttonClass}>{option}</button>);
                                })}
                                {quizAnswer !== null && (
                                    <p className="text-sm text-stone-600 mt-2 p-2 bg-stone-100 rounded-md">
                                        <span className="font-bold">Explanation:</span> {step.quiz.explanation}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader /></div>
    }
    if (error) {
        return <Card><p className="text-red-600 text-center">{error}</p><button onClick={() => setSelectedTopic(null)} className="mt-4 mx-auto block text-sm font-medium text-islamic-green-dark hover:underline">Try again</button></Card>
    }

    return (
        <div className="space-y-6 overflow-y-auto p-1 h-full">
            {selectedTopic && learningPath ? <LearningPathView /> : <TopicSelectionView />}
            {isVerseModalOpen && selectedVerse && (
                <VerseModal 
                    isOpen={isVerseModalOpen}
                    onClose={() => setIsVerseModalOpen(false)}
                    surahNumber={selectedVerse.surah}
                    ayahNumber={selectedVerse.ayah}
                />
            )}
        </div>
    );
};

export default LearningView;
