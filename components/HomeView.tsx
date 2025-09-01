
import React, { useEffect, useState } from 'react';
import { VerseOfTheDayData } from '../types';
import { getHijriDate } from '../services/dateApiService';
import { getRandomVerse } from '../services/quranApiService';
import { useRecitationHistory } from '../hooks/useRecitationHistory';
import { Card } from './common/Card';
import { SkeletonLoader } from './common/SkeletonLoader';
import { useAppContext } from '../contexts/AppContext';

// Icons for the navigation cards
const StudyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-islamic-green-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18M5.47 7.747a12.023 12.023 0 0013.06 0M5.47 16.253a12.023 12.023 0 0113.06 0" /></svg>;
const ReciteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-islamic-green-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>;
const HadithIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-islamic-green-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" /></svg>;
const ReadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-islamic-green-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v-4.764a2 2 0 01.553-1.414l4.83-4.83a2 2 0 012.828 0l4.83 4.83A2 2 0 0121 9.236V14M3 14h5M3 10h5M3 6h5" /></svg>

const HomeView: React.FC = () => {
  const { setCurrentView, handleResumePractice, prayerTimes, isLoadingLocationData, locationError } = useAppContext();
  const [hijriDate, setHijriDate] = useState<string>('');
  const [verseOfTheDay, setVerseOfTheDay] = useState<VerseOfTheDayData | null>(null);
  const [isLoading, setIsLoading] = useState({ date: true, verse: true });
  const [verseError, setVerseError] = useState('');
  
  const { history } = useRecitationHistory();
  const recentPractices = history.slice(0, 3);

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
  
  const NavCard: React.FC<{ title: string, description: string, icon: React.ReactNode, onClick: () => void }> = ({ title, description, icon, onClick }) => (
    <button onClick={onClick} className="w-full text-left p-4 bg-white/50 rounded-lg border border-stone-200 hover:bg-islamic-gold-light/30 hover:ring-2 hover:ring-islamic-gold transition duration-300 flex items-center space-x-4">
      <div>{icon}</div>
      <div>
        <h3 className="font-bold text-islamic-green-dark">{title}</h3>
        <p className="text-sm text-stone-600">{description}</p>
      </div>
    </button>
  );

  return (
    <div className="space-y-6 overflow-y-auto p-1 h-full">
      {/* Header */}
      <Card className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-islamic-green-dark">As-salamu alaykum</h2>
        <p className="text-stone-500 mt-1">{isLoading.date ? <SkeletonLoader className="h-5 w-48 mx-auto" /> : hijriDate}</p>
      </Card>

      {/* Verse of the Day */}
      <Card>
        <h3 className="font-semibold text-islamic-green-dark mb-4 text-lg">Verse of the Day</h3>
        {isLoading.verse ? (
          <div className="space-y-4 text-center">
            <SkeletonLoader className="h-8 w-full" />
            <SkeletonLoader className="h-6 w-3/4 mx-auto" />
            <SkeletonLoader className="h-4 w-1/3 mx-auto" />
          </div>
        ) : verseError ? (
          <p className="text-red-600 text-center py-8">{verseError}</p>
        ) : verseOfTheDay ? (
          <div className="text-center space-y-4">
            <p className="font-amiri text-3xl leading-relaxed text-stone-900" dir="rtl">{verseOfTheDay.arabic}</p>
            <p className="text-stone-600 italic">"{verseOfTheDay.english}"</p>
            <p className="text-sm text-stone-500 font-semibold">({verseOfTheDay.surahName} {verseOfTheDay.surahNumber}:{verseOfTheDay.ayahNumber})</p>
          </div>
        ) : null}
      </Card>
      
      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NavCard title="Quran Reader" description="Read Surahs and translations." icon={<ReadIcon />} onClick={() => setCurrentView('read')} />
          <NavCard title="Tajweed Practice" description="Recite and get feedback." icon={<ReciteIcon />} onClick={() => setCurrentView('tajweed')} />
          <NavCard title="Study Companion" description="Ask questions & get Tafsir." icon={<StudyIcon />} onClick={() => setCurrentView('study')} />
          <NavCard title="Hadith Search" description="Explore prophetic traditions." icon={<HadithIcon />} onClick={() => setCurrentView('hadith')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prayer Times */}
        <Card>
            <h3 className="font-semibold text-islamic-green-dark mb-4 text-lg">Daily Prayers</h3>
            {isLoadingLocationData ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                            <SkeletonLoader className="h-5 w-16" />
                            <SkeletonLoader className="h-5 w-12" />
                        </div>
                    ))}
                </div>
            ) : locationError ? (
                <div className="text-center py-6">
                    <p className="text-sm text-red-600">{locationError}</p>
                </div>
            ) : prayerTimes ? (
                <ul className="space-y-2 text-stone-700">
                    {Object.entries(prayerTimes).map(([name, time]) => (
                        <li key={name} className="flex justify-between items-center">
                            <span className="font-medium">{name}</span>
                            <span className="text-sm font-semibold text-stone-600">{time}</span>
                        </li>
                    ))}
                </ul>
            ) : null}
        </Card>

        {/* Recent Activity */}
        <Card>
            <h3 className="font-semibold text-islamic-green-dark mb-4 text-lg">Recent Practice</h3>
            {recentPractices.length > 0 ? (
                <div className="space-y-2">
                    {recentPractices.map(item => (
                       <button
                         key={item.id}
                         onClick={() => handleResumePractice(item.surahNumber, item.ayahNumber)}
                         className="w-full text-left p-3 rounded-lg transition-colors bg-stone-50 hover:bg-stone-100 border border-stone-200"
                       >
                         <div className="font-semibold text-stone-800">
                           {item.surahName} - Ayah {item.ayahNumber}
                         </div>
                         <div className="text-sm text-stone-500">
                           {new Date(item.timestamp).toLocaleDateString()}
                         </div>
                       </button>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-stone-500 mb-4">You haven't practiced any recitations yet.</p>
                    <button onClick={() => setCurrentView('tajweed')} className="px-4 py-2 bg-islamic-green text-white rounded-lg hover:bg-islamic-green-dark transition shadow-sm font-medium">
                        Start Now
                    </button>
                </div>
            )}
        </Card>
      </div>
    </div>
  );
};

export default HomeView;
