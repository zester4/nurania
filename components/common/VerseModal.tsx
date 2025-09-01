import React, { useState, useEffect } from 'react';
import { getVerse } from '../../services/quranApiService';
import { VerseData } from '../../types';
import { Card } from './Card';
import { SkeletonLoader } from './SkeletonLoader';

interface VerseModalProps {
  isOpen: boolean;
  onClose: () => void;
  surahNumber: number;
  ayahNumber: number;
}

export const VerseModal: React.FC<VerseModalProps> = ({ isOpen, onClose, surahNumber, ayahNumber }) => {
  const [verseData, setVerseData] = useState<VerseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchVerse = async () => {
        setIsLoading(true);
        setError(null);
        setVerseData(null);
        try {
          const data = await getVerse(surahNumber, ayahNumber);
          setVerseData(data);
        } catch (err: any) {
          setError(err.message || 'Could not load verse.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchVerse();
    }
  }, [isOpen, surahNumber, ayahNumber]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div 
        className="w-full max-w-lg"
        onClick={e => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <Card className="relative">
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-stone-500 hover:text-stone-800 transition-colors p-1"
            aria-label="Close verse view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <h3 className="text-lg font-semibold text-islamic-green-dark mb-4 pr-8">
            Quran {surahNumber}:{ayahNumber}
          </h3>

          {isLoading && (
            <div className="text-center space-y-4 py-8">
              <SkeletonLoader className="h-10 w-full" />
              <SkeletonLoader className="h-6 w-3/4 mx-auto" />
            </div>
          )}
          {error && <p className="text-red-600 text-center py-8">{error}</p>}
          {verseData && (
            <div className="text-center space-y-4">
              <p className="font-amiri text-4xl leading-relaxed text-stone-900" dir="rtl">{verseData.arabic}</p>
              <p className="text-stone-600 italic">"{verseData.english}"</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
