import React, { useState } from 'react';
import { StructuredTajweedFeedback, TajweedFeedbackItem } from '../types';

interface VisualFeedbackProps {
  verse: string;
  feedbackData: StructuredTajweedFeedback;
}

const MakhrajGuide: React.FC<{ makhrajKey: TajweedFeedbackItem['makhrajKey'] }> = ({ makhrajKey }) => {
    const GuideSvg: React.FC<{ highlight: 'throat' | 'tongue' | 'lips' | 'nasal' }> = ({ highlight }) => (
      <svg viewBox="0 0 100 100" className="w-24 h-24 text-stone-600">
        {/* Head outline */}
        <path d="M 60 95 C 20 95, 10 60, 30 30 S 70 -10, 90 20 S 90 80, 60 95 Z" fill="#f5f5f4" stroke="currentColor" strokeWidth="2" />
        {/* Nasal passage */}
        <path d="M 88 42 Q 75 45, 70 55" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2" />
        {/* Mouth */}
        <path d="M 89 58 C 70 62, 60 65, 50 70" fill="none" stroke="currentColor" strokeWidth="1.5" />
        {/* Tongue */}
        <path d="M 80 65 Q 65 72, 52 68 T 55 60" fill="#fca5a5" stroke="currentColor" strokeWidth="1" />

        {/* Highlights */}
        {highlight === 'nasal' && <circle cx="80" cy="45" r="8" fill="#fca5a5" opacity="0.7" />}
        {highlight === 'throat' && <circle cx="50" cy="80" r="10" fill="#fca5a5" opacity="0.7" />}
        {highlight === 'lips' && <circle cx="90" cy="59" r="6" fill="#fca5a5" opacity="0.7" />}
        {highlight === 'tongue' && <path d="M 80 65 Q 65 72, 52 68 T 55 60" fill="#ef4444" stroke="currentColor" strokeWidth="1" opacity="0.8" />}
      </svg>
    );

    switch (makhrajKey) {
        case 'THROAT': return <GuideSvg highlight="throat" />;
        case 'TONGUE': return <GuideSvg highlight="tongue" />;
        case 'LIPS': return <GuideSvg highlight="lips" />;
        case 'NASAL': return <GuideSvg highlight="nasal" />;
        default: return null;
    }
};


export const VisualFeedback: React.FC<VisualFeedbackProps> = ({ verse, feedbackData }) => {
  const [activePopover, setActivePopover] = useState<TajweedFeedbackItem | null>(null);

  const renderVerseWithHighlights = () => {
    const words = verse.split(' ');
    const feedbackByWordIndex: { [key: number]: TajweedFeedbackItem[] } = {};
    feedbackData.feedbackItems.forEach(item => {
        if (!feedbackByWordIndex[item.wordIndex]) {
            feedbackByWordIndex[item.wordIndex] = [];
        }
        feedbackByWordIndex[item.wordIndex].push(item);
    });

    return words.map((word, index) => {
      const feedbacksForWord = feedbackByWordIndex[index];
      if (!feedbacksForWord) {
        return <span key={index}>{word} </span>;
      }
      
      // A simple regex to split the word by the letters that need highlighting
      // This is a simplified approach
      const lettersToHighlight = feedbacksForWord.map(f => f.letter).join('');
      const regex = new RegExp(`([${lettersToHighlight}])`, 'g');
      const parts = word.split(regex);

      return (
        <span key={index} className="whitespace-nowrap">
          {parts.map((part, i) => {
            const feedbackForItem = feedbacksForWord.find(f => f.letter === part);
            if (feedbackForItem) {
              return (
                <span key={i} className="relative inline-block">
                  <span 
                    className="bg-islamic-gold-light text-islamic-green-dark rounded-sm px-0.5 cursor-pointer font-bold"
                    onMouseEnter={() => setActivePopover(feedbackForItem)}
                    onMouseLeave={() => setActivePopover(null)}
                  >
                    {part}
                  </span>
                  {activePopover === feedbackForItem && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-stone-800 text-white text-sm rounded-lg shadow-xl z-10 text-left normal-case font-sans" dir="ltr">
                      <div className="flex items-start space-x-2">
                        <MakhrajGuide makhrajKey={activePopover.makhrajKey} />
                        <div>
                          <p className="font-semibold capitalize mb-1">{activePopover.makhrajKey.toLowerCase()} Articulation</p>
                          <p>{activePopover.feedback}</p>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-b-[8px] border-b-stone-800 -mb-2"></div>
                    </div>
                  )}
                </span>
              );
            }
            return part;
          })}
          {' '}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center bg-stone-50 p-4 rounded-lg">
        <p className="font-amiri text-4xl leading-loose text-stone-900" dir="rtl">
          {renderVerseWithHighlights()}
        </p>
      </div>
      <div className="prose prose-stone max-w-none">
        <p>{feedbackData.encouragement}</p>
        {feedbackData.feedbackItems.length > 0 && (
          <ul>
            {feedbackData.feedbackItems.map((item, index) => (
              <li key={index}>{item.feedback}</li>
            ))}
          </ul>
        )}
        <p>{feedbackData.conclusion}</p>
      </div>
    </div>
  );
};