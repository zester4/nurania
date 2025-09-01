import React, { useState, useEffect, useRef } from 'react';
import { SurahInfo, FullSurah } from '../types';
import { getAllSurahs, getSurah } from '../services/quranApiService';
import { Card } from './common/Card';
import { SkeletonLoader } from './common/SkeletonLoader';
import { useReadProgress } from '../hooks/useReadProgress';
import { IconButton, CheckCircleIcon, CheckCircleFilledIcon, BookmarkIcon, BookmarkFilledIcon } from './common/IconButton';
import { AudioPlayer } from './AudioPlayer';
import { useBookmarkedVerses } from '../hooks/useBookmarkedVerses';
import { useAppContext } from '../contexts/AppContext';

const LAST_READ_KEY = 'nuraniaLastReadPosition';

const ReadView: React.FC = () => {
  const { logChallengeAction, gotoVerse, clearGotoVerse } = useAppContext();
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [currentSurah, setCurrentSurah] = useState<FullSurah | null>(null);
  const [isLoading, setIsLoading] = useState({ surahs: true, surahData: true });
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlayingAyah, setCurrentlyPlayingAyah] = useState<number | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  const { progress, toggleVerseRead, isVerseRead, markAllVersesRead, markAllVersesUnread, getSurahProgress } = useReadProgress();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarkedVerses();

  useEffect(() => {
    if (gotoVerse) {
        setSelectedSurahNumber(gotoVerse.surahNumber);
    } else {
        try {
            const stored = localStorage.getItem(LAST_READ_KEY);
            if (stored) setSelectedSurahNumber(JSON.parse(stored).surahNumber);
        } catch { /* use default */ }
    }
  }, [gotoVerse]);


  useEffect(() => {
    const fetchSurahList = async () => {
      try {
        const surahList = await getAllSurahs();
        setSurahs(surahList);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(prev => ({ ...prev, surahs: false }));
      }
    };
    fetchSurahList();
  }, []);

  useEffect(() => {
    const fetchSurahData = async () => {
      setIsLoading(prev => ({ ...prev, surahData: true }));
      setError(null);
      setCurrentSurah(null);
      try {
        const surahData = await getSurah(selectedSurahNumber);
        setCurrentSurah(surahData);
        
        setTimeout(() => {
            let targetAyahNumber = 1;
            if (gotoVerse && gotoVerse.surahNumber === selectedSurahNumber) {
                targetAyahNumber = gotoVerse.ayahNumber;
                clearGotoVerse();
            } else {
                try {
                    const stored = localStorage.getItem(LAST_READ_KEY);
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if(parsed.surahNumber === selectedSurahNumber) {
                            targetAyahNumber = parsed.ayahNumber;
                        }
                    }
                } catch {}
            }
            
            const element = document.getElementById(`ayah-${targetAyahNumber}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 200);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(prev => ({ ...prev, surahData: false }));
      }
    };
    fetchSurahData();
  }, [selectedSurahNumber, gotoVerse, clearGotoVerse]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const savePosition = (surah: number, ayah: number) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = window.setTimeout(() => {
            try {
                localStorage.setItem(LAST_READ_KEY, JSON.stringify({ surahNumber: surah, ayahNumber: ayah }));
            } catch (e) { console.error("Failed to save last read position:", e); }
        }, 500);
    };

    observerRef.current = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const ayahNumber = Number((entry.target as HTMLElement).dataset.ayahNumber);
                    if (ayahNumber && currentSurah) {
                        savePosition(currentSurah.id, ayahNumber);
                        return;
                    }
                }
            }
        },
        { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );

    const observer = observerRef.current;
    document.querySelectorAll('.ayah-item').forEach(v => observer.observe(v));

    return () => {
        observer.disconnect();
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [currentSurah]);
  
  const handleToggleRead = (surahId: number, ayahId: number) => {
      if (!isVerseRead(surahId, ayahId)) {
          logChallengeAction('readVerses', 1);
      }
      toggleVerseRead(surahId, ayahId);
  };

  const surahProgress = currentSurah ? getSurahProgress(currentSurah.id, currentSurah.total_verses) : 0;
  const isSurahComplete = surahProgress === 100;

  const handleMarkSurah = () => {
    if (!currentSurah) return;
    if (isSurahComplete) markAllVersesUnread(currentSurah.id);
    else markAllVersesRead(currentSurah.id, currentSurah.total_verses);
  };
  
    const SurahHeaderSkeleton: React.FC = () => (
    <div className="text-center space-y-3">
        <SkeletonLoader className="h-10 w-48 mx-auto" />
        <SkeletonLoader className="h-6 w-64 mx-auto" />
        <SkeletonLoader className="h-5 w-32 mx-auto" />
    </div>
  );

  const VerseSkeleton: React.FC = () => (
      <div className="border-b border-stone-200 py-6 space-y-4">
          <div className="flex justify-between items-center">
              <SkeletonLoader className="h-6 w-16 rounded-md"/>
          </div>
          <div className="space-y-3 text-right">
              <SkeletonLoader className="h-8 w-full"/>
              <SkeletonLoader className="h-8 w-3/4 ml-auto"/>
          </div>
          <div className="space-y-2">
              <SkeletonLoader className="h-5 w-full" />
              <SkeletonLoader className="h-5 w-5/6" />
          </div>
      </div>
  );


  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6 overflow-y-auto p-1 flex-grow">
          <Card>
            <h2 className="text-xl font-semibold text-islamic-green-dark mb-4">Quran</h2>
            {isLoading.surahs ? ( <SkeletonLoader className="h-12 w-full" /> ) : (
              <div>
                <label htmlFor="surah-select-reader" className="block text-sm font-medium text-stone-600 mb-2">Select Surah:</label>
                <select
                  id="surah-select-reader"
                  value={selectedSurahNumber}
                  onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
                  className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition"
                >
                  {surahs.map(surah => {
                    const progressPercent = getSurahProgress(surah.surahNumber, surah.totalAyah);
                    return ( <option key={surah.surahNumber} value={surah.surahNumber}> {surah.surahNumber}. {surah.surahName} ({surah.surahNameArabic}) {progressPercent > 0 && ` - ${progressPercent}%`} </option> )
                  })}
                </select>
              </div>
            )}
          </Card>
          
          <Card>
            {isLoading.surahData && (
                <div>
                    <SurahHeaderSkeleton />
                    <div className="mt-8">
                        <VerseSkeleton />
                        <VerseSkeleton />
                    </div>
                </div>
            )}
            {error && <p className="text-center text-red-600">{error}</p>}
            {currentSurah && !isLoading.surahData && (
              <div>
                <div className="text-center border-b-2 border-islamic-gold pb-4 mb-4">
                  <h3 className="font-amiri text-5xl text-islamic-green-dark">{currentSurah.name}</h3>
                  <h4 className="text-2xl font-semibold text-stone-700 mt-2">{currentSurah.transliteration}</h4>
                  <p className="text-stone-500">"{currentSurah.translation}"</p>
                  <div className="mt-2 text-sm text-stone-500 uppercase"><span>{currentSurah.type} &bull; {currentSurah.total_verses} Verses</span></div>
                </div>
                
                <div className="mb-6 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-stone-600">Progress: {surahProgress}%</span>
                        <button onClick={handleMarkSurah} className="text-sm font-medium text-islamic-green hover:text-islamic-green-dark transition-colors">
                            {isSurahComplete ? 'Mark as Unread' : 'Mark All as Read'}
                        </button>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2.5"><div className="bg-islamic-green h-2.5 rounded-full transition-all duration-500" style={{ width: `${surahProgress}%` }}></div></div>
                </div>

                <div className="space-y-4">
                    {currentSurah.verses.map((ayah) => {
                        const isRead = isVerseRead(currentSurah.id, ayah.id);
                        const isPlaying = currentlyPlayingAyah === ayah.id;
                        const bookmarked = isBookmarked(currentSurah.id, ayah.id);

                        const handleBookmarkToggle = () => {
                            if (bookmarked) {
                                removeBookmark(currentSurah.id, ayah.id);
                            } else {
                                addBookmark({
                                    surahNumber: currentSurah.id,
                                    surahName: currentSurah.transliteration,
                                    ayahNumber: ayah.id,
                                    arabic: ayah.text,
                                    english: ayah.translation_en,
                                });
                                logChallengeAction('bookmarkVerse');
                            }
                        };
                        
                        return (
                            <div key={ayah.id} id={`ayah-${ayah.id}`} data-ayah-number={ayah.id} className={`ayah-item border-b border-stone-200 py-5 rounded-lg transition-all duration-300 ${ isRead ? 'bg-islamic-green/5' : '' } ${ isPlaying ? 'bg-islamic-gold-light/50 ring-2 ring-islamic-gold' : '' }`}>
                                <div className="flex justify-between items-center mb-4 px-4">
                                    <span className="text-sm font-bold text-islamic-green bg-islamic-gold-light/50 px-3 py-1 rounded-md"> {currentSurah.id}:{ayah.id} </span>
                                    <div className="flex items-center space-x-2">
                                        <IconButton onClick={handleBookmarkToggle} aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}>
                                            {bookmarked ? <BookmarkFilledIcon className="w-6 h-6 text-islamic-gold" /> : <BookmarkIcon className="w-6 h-6 text-stone-400" />}
                                        </IconButton>
                                        <IconButton onClick={() => handleToggleRead(currentSurah.id, ayah.id)} aria-label={isRead ? 'Mark as unread' : 'Mark as read'}>
                                            {isRead ? <CheckCircleFilledIcon className="w-6 h-6 text-islamic-green" /> : <CheckCircleIcon className="w-6 h-6 text-stone-400" />}
                                        </IconButton>
                                    </div>
                                </div>
                                <div className="px-4">
                                  <p className="font-amiri text-4xl text-right leading-loose text-stone-900 mb-4" dir="rtl">{ayah.text}</p>
                                  <p className="text-stone-700 leading-relaxed">{ayah.translation_en}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>
            )}
          </Card>
      </div>
      {currentSurah && !isLoading.surahData && <AudioPlayer verses={currentSurah.verses} onAyahChange={setCurrentlyPlayingAyah} />}
    </div>
  );
};

export default ReadView;
