import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Card } from './common/Card';
import { CheckCircleFilledIcon } from './common/IconButton';

const FireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
       <path fillRule="evenodd" d="M10 2c-1.716 0-3.408.106-5.02.317a.75.75 0 00-.623.832c.325 3.513 1.543 6.643 3.293 9.099.71 1.003 1.52 1.838 2.35 2.53.83.692 1.662 1.233 2.473 1.618a.75.75 0 00.973-.553c.153-.465.263-.94.328-1.428.093-.687.11-1.39.053-2.094a62.09 62.09 0 00-.51-4.282c-.135-.85-.22-1.673-.24-2.453-.024-.91.13-1.785.438-2.585a.75.75 0 00-.658-.879C12.481 2.11 11.246 2 10 2z" clipRule="evenodd" />
   </svg>
);

export const DailyChallenges: React.FC = () => {
    const { dailyChallengeState } = useAppContext();
    const { challenges, streak } = dailyChallengeState;

    if (!challenges || challenges.length === 0) {
        return null;
    }

    const allComplete = challenges.every(c => c.completed);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-islamic-green-dark text-lg">Daily Goals</h3>
                <div className={`flex items-center space-x-1 font-bold px-3 py-1 rounded-full transition-colors ${streak > 0 ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-500'}`}>
                    <FireIcon className={`w-5 h-5 ${streak > 0 ? 'text-amber-500' : 'text-stone-400'}`} />
                    <span>{streak} Day Streak</span>
                </div>
            </div>
            <div className="space-y-3">
                {challenges.map(challenge => (
                    <div key={challenge.id} className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                            {challenge.completed ? (
                                <CheckCircleFilledIcon className="w-6 h-6 text-islamic-green" />
                            ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-stone-300" />
                            )}
                        </div>
                        <div className="flex-grow">
                            <p className={`font-medium transition-colors ${challenge.completed ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{challenge.description}</p>
                            {!challenge.completed && challenge.target > 1 && (
                                <div className="w-full bg-stone-200 rounded-full h-1.5 mt-1">
                                    <div className="bg-islamic-gold h-1.5 rounded-full" style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {allComplete && (
                 <p className="text-center text-sm font-semibold text-islamic-green mt-4 pt-4 border-t border-stone-200">
                    All goals for today complete! See you tomorrow, Insha'Allah.
                </p>
            )}
        </Card>
    );
};