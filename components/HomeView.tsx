import React, { useState, useEffect } from 'react';
import { VerseOfTheDayData } from '../types';
import { getHijriDate } from '../services/dateApiService';
import { getRandomVerse } from '../services/quranApiService';
import { Card } from './common/Card';
import { SkeletonLoader } from './common/SkeletonLoader';
import { useAppContext } from '../contexts/AppContext';
import { useLastReadPosition } from '../hooks/useLastReadPosition';
import { useLastViewedHadith } from '../hooks/useLastViewedHadith';
import { useLastLearningPath } from '../hooks/useLastLearningPath';
import { DailyChallenges } from './DailyChallenges';
import { ChatBubbleIcon, GraduationCapIcon, SearchIcon } from './common/IconButton';
import { useRecitationHistory } from '../hooks/useRecitationHistory';

// Icons
const ReciteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>;
const ReadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;


const HomeView: React.FC = () => {
  const { setCurrentView, handleResumePractice, handleGotoVerse, handleGotoHadith, handleGotoLearningPath } = useAppContext();
  const [hijriDate, setHijriDate] = useState<string>('');
  const [verseOfTheDay, setVerseOfTheDay] = useState<VerseOfTheDayData | null>(null);
  const [isLoading, setIsLoading] = useState({ date: true, verse: true });
  const [verseError, setVerseError] = useState('');
  
  const { history } = useRecitationHistory();
  const { lastRead } = useLastReadPosition();
  const { lastViewedHadith } = useLastViewedHadith();
  const { lastLearningPath } = useLastLearningPath();
  const lastPractice = history.length > 0 ? history[0] : null;

  useEffect(() => {
    const fetchDate = async () => {
      const date = await getHijriDate();
      setHijriDate(date);
      setIsLoading(prev => ({ ...prev, date: false }));
    };

    const fetchVerse = async () => {
      try {
        setVerseError('');
        const verse = await getRandomVerse();
        setVerseOfTheDay(verse);
      } catch (err: any) {
        setVerseError(err.message);
      } finally {
        setIsLoading(prev => ({ ...prev, verse: false }));
      }
    };

    fetchDate();
    fetchVerse();
  }, []);
  
  const QuickActionButton: React.FC<{ title: string, icon: React.ReactNode, onClick: () => void, className?: string }> = ({ title, icon, onClick, className }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 space-y-2 rounded-xl text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${className}`}>
      <div className="p-3 bg-white/20 rounded-full">
        {icon}
      </div>
      <span className="font-bold text-sm text-center">{title}</span>
    </button>
  );

  return (
    <div className="space-y-6 overflow-y-auto p-1 h-full">
      <Card className="text-center bg-gradient-to-br from-islamic-green-dark to-islamic-green text-white shadow-xl">
        <h2 className="text-2xl md:text-3xl font-bold">As-salamu alaykum</h2>
        <p className="text-stone-300 mt-1">{isLoading.date ? <SkeletonLoader className="h-5 w-48 mx-auto bg-white/30" /> : hijriDate}</p>
      </Card>
      
      <DailyChallenges />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col justify-between">
            <h3 className="font-semibold text-islamic-green-dark mb-4 text-lg">Verse of the Day</h3>
            {isLoading.verse ? (
              <div className="space-y-4 text-center flex-grow flex flex-col justify-center">
                <SkeletonLoader className="h-8 w-full" />
                <SkeletonLoader className="h-6 w-3/4 mx-auto" />
                <SkeletonLoader className="h-4 w-1/3 mx-auto" />
              </div>
            ) : verseError ? (
              <p className="text-red-600 text-center py-8">{verseError}</p>
            ) : verseOfTheDay ? (
              <div className="text-center space-y-4 flex-grow flex flex-col justify-center">
                <p className="font-amiri text-3xl leading-relaxed text-stone-900" dir="rtl">{verseOfTheDay.arabic}</p>
                <p className="text-stone-600 italic">"{verseOfTheDay.english}"</p>
                <p className="text-sm text-stone-500 font-semibold">({verseOfTheDay.surahName} {verseOfTheDay.surahNumber}:{verseOfTheDay.ayahNumber})</p>
              </div>
            ) : null}
             <button onClick={() => setCurrentView('search')} className="mt-6 text-sm font-medium text-islamic-green hover:text-islamic-green-dark transition-colors w-full text-center">
                Search for a verse...
             </button>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h3 className="font-semibold text-islamic-green-dark mb-3 text-lg">Continue...</h3>
            <div className="space-y-3">
              {lastLearningPath && (
                <button onClick={() => handleGotoLearningPath(lastLearningPath.topicId)} className="w-full text-left p-3 rounded-lg transition-colors bg-stone-50 hover:bg-stone-100 border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-stone-500 font-medium">LEARNING PATH</span>
                    <p className="font-semibold text-stone-800 truncate">{lastLearningPath.topicTitle}</p>
                  </div>
                  <ChevronRightIcon />
                </button>
              )}
              {lastRead && (
                <button onClick={() => handleGotoVerse(lastRead.surahNumber, lastRead.ayahNumber)} className="w-full text-left p-3 rounded-lg transition-colors bg-stone-50 hover:bg-stone-100 border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-stone-500 font-medium">QURAN</span>
                    <p className="font-semibold text-stone-800">{lastRead.surahName} - Ayah {lastRead.ayahNumber}</p>
                  </div>
                  <ChevronRightIcon />
                </button>
              )}
               {lastPractice && (
                <button onClick={() => handleResumePractice(lastPractice.surahNumber, lastPractice.ayahNumber)} className="w-full text-left p-3 rounded-lg transition-colors bg-stone-50 hover:bg-stone-100 border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-stone-500 font-medium">PRACTICE</span>
                    <p className="font-semibold text-stone-800">{lastPractice.surahName} - Ayah {lastPractice.ayahNumber}</p>
                  </div>
                  <ChevronRightIcon />
                </button>
              )}
               {lastViewedHadith && (
                <button onClick={() => handleGotoHadith(lastViewedHadith.bookSlug, lastViewedHadith.chapter)} className="w-full text-left p-3 rounded-lg transition-colors bg-stone-50 hover:bg-stone-100 border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-stone-500 font-medium">HADITH</span>
                    <p className="font-semibold text-stone-800 truncate">{lastViewedHadith.bookName}</p>
                     <p className="text-sm text-stone-600 truncate">Ch. {lastViewedHadith.chapter.chapterNumber}: {lastViewedHadith.chapter.chapterEnglish}</p>
                  </div>
                  <ChevronRightIcon />
                </button>
              )}
              {!lastRead && !lastPractice && !lastViewedHadith && !lastLearningPath && (
                 <p className="text-sm text-stone-500 text-center p-4">Start a lesson to see your progress here.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton title="Read Quran" icon={<ReadIcon />} onClick={() => setCurrentView('read')} className="bg-gradient-to-br from-islamic-green to-islamic-green-dark" />
          <QuickActionButton title="Practice Recitation" icon={<ReciteIcon />} onClick={() => setCurrentView('tajweed')} className="bg-gradient-to-br from-islamic-gold to-[#b38e4a]" />
          <QuickActionButton title="Learning Paths" icon={<GraduationCapIcon className="w-8 h-8"/>} onClick={() => setCurrentView('learning')} className="bg-gradient-to-br from-sky-700 to-sky-900" />
          <QuickActionButton title="AI Chat" icon={<ChatBubbleIcon className="w-8 h-8" />} onClick={() => setCurrentView('study')} className="bg-gradient-to-br from-stone-600 to-stone-800" />
      </div>
    </div>
  );
};

export default HomeView;