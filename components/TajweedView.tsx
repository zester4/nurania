import React, { useState, useEffect, useRef } from 'react';
import { SurahInfo, Reciter, VerseData, Tafsir, StructuredTajweedFeedback, RecitationHistoryItem } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { getTajweedFeedback } from '../services/geminiService';
import { getAllSurahs, getVerse, getTafsirForVerse } from '../services/quranApiService';
import { useRecitationHistory } from '../hooks/useRecitationHistory';
import { MicIcon, SpeakerIcon, StopIcon, BookOpenIcon } from './common/IconButton';
import { Loader } from './common/Loader';
import { Card } from './common/Card';
import ReactMarkdown from 'react-markdown';
import { VisualFeedback } from './VisualFeedback';
import { SkeletonLoader } from './common/SkeletonLoader';

interface TajweedViewProps {
  initialVerse: { surahNumber: number; ayahNumber: number } | null;
  onPracticeMounted: () => void;
}

const TajweedView: React.FC<TajweedViewProps> = ({ initialVerse, onPracticeMounted }) => {
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<SurahInfo | null>(null);
  const [selectedAyah, setSelectedAyah] = useState<number>(1);
  const [currentVerse, setCurrentVerse] = useState<VerseData | null>(null);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [selectedReciterId, setSelectedReciterId] = useState<string | null>(null);
  
  const [feedback, setFeedback] = useState<StructuredTajweedFeedback | null>(null);
  const [tafsirData, setTafsirData] = useState<Tafsir[] | null>(null);
  const [activeTafsirAuthor, setActiveTafsirAuthor] = useState<string | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<RecitationHistoryItem | null>(null);


  const [isLoading, setIsLoading] = useState({ surahs: true, verse: true, feedback: false, tafsir: false });
  const [error, setError] = useState({ general: '', tafsir: '' });
  
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [repeatCount, setRepeatCount] = useState(1);
  const currentRepetitionRef = useRef(0);


  const { isListening, transcript, startListening, stopListening, isSpeechSupported } = useSpeech();
  const { history, addHistoryItem } = useRecitationHistory();

  // Fetch all Surahs on initial component mount
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        setError(prev => ({ ...prev, general: '' }));
        const surahList = await getAllSurahs();
        setSurahs(surahList);
        // Set default surah if no initial verse is provided
        if (!initialVerse) {
          setSelectedSurah(surahList[0]); // Default to Al-Fatihah
        }
      } catch (err: any) {
        setError(prev => ({ ...prev, general: err.message }));
      } finally {
        setIsLoading(prev => ({ ...prev, surahs: false }));
      }
    };
    fetchSurahs();
  }, [initialVerse]);

  // Handle pre-loading a verse from props (e.g., from home page)
  useEffect(() => {
    if (initialVerse && surahs.length > 0) {
      const surahToSelect = surahs.find(s => s.surahNumber === initialVerse.surahNumber);
      if (surahToSelect) {
        setSelectedSurah(surahToSelect);
        setSelectedAyah(initialVerse.ayahNumber);
      }
      onPracticeMounted(); // Notify parent that the initial verse has been handled
    }
  }, [initialVerse, surahs, onPracticeMounted]);


  // Fetch verse text when surah or ayah changes
  useEffect(() => {
    if (!selectedSurah) return;

    const fetchVerse = async () => {
      setIsLoading(prev => ({ ...prev, verse: true }));
      setError({ general: '', tafsir: '' });
      setFeedback(null); // Clear feedback for new verse
      setTafsirData(null); // Clear tafsir for new verse
      setSelectedHistoryItem(null); // Clear history selection
      try {
        const verseData = await getVerse(selectedSurah.surahNumber, selectedAyah);
        setCurrentVerse(verseData);
        setReciters(verseData.reciters);
        
        if (verseData.reciters.length > 0) {
          const preferredReciter = verseData.reciters.find(r => r.id === selectedReciterId);
          if (preferredReciter) {
            setSelectedReciter(preferredReciter);
          } else {
            const defaultReciter = verseData.reciters[0];
            setSelectedReciter(defaultReciter);
            // Also update the stored preference to this new default.
            setSelectedReciterId(defaultReciter.id);
          }
        } else {
          setSelectedReciter(null);
        }
      } catch (err: any) {
        setError(prev => ({...prev, general: err.message}));
        setCurrentVerse(null);
        setReciters([]);
        setSelectedReciter(null);
      } finally {
        setIsLoading(prev => ({ ...prev, verse: false }));
      }
    };
    fetchVerse();
  }, [selectedSurah, selectedAyah]);

  // When listening stops, get feedback
  useEffect(() => {
    if (!isListening && transcript) {
      handleGetFeedback(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript]);
  
  // Cleanup audio player on unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.onplay = null;
        audio.onpause = null;
        audio.onended = null;
        audio.onerror = null;
      }
    };
  }, []);

  const handleGetFeedback = async (userRecitation: string) => {
    if (!currentVerse || !selectedSurah) return;
    setIsLoading(prev => ({ ...prev, feedback: true }));
    setError(prev => ({...prev, general: ''}));
    setFeedback(null);
    setSelectedHistoryItem(null);
    try {
      const response = await getTajweedFeedback(currentVerse.arabic, userRecitation);
      setFeedback(response);
      // Save to history
      const newHistoryItem: RecitationHistoryItem = {
        id: `${Date.now()}`,
        surahName: selectedSurah.surahName,
        surahNumber: selectedSurah.surahNumber,
        ayahNumber: selectedAyah,
        verseArabic: currentVerse.arabic,
        feedback: response,
        timestamp: new Date().toISOString(),
      };
      addHistoryItem(newHistoryItem);

    // FIX: The catch block had a syntax error which caused cascading scope issues.
    } catch (err: any) {
      setError(prev => ({...prev, general: err.message || 'An unexpected error occurred.'}));
    } finally {
      setIsLoading(prev => ({ ...prev, feedback: false }));
    }
  };

  const handleReciteClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setFeedback(null);
      setSelectedHistoryItem(null);
      startListening('ar-SA');
    }
  };
  
  const handlePlayRecitation = () => {
    if (!selectedReciter) {
      setError(prev => ({...prev, general: "Please select a reciter."}));
      return;
    }
    if (audioRef.current && isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
      return;
    }
    
    currentRepetitionRef.current = 1;
    const url = selectedReciter.url;
    
    // If an old audio object exists, remove its listeners
    if (audioRef.current) {
      audioRef.current.onplay = null;
      audioRef.current.onpause = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => setIsAudioPlaying(true);
    
    const onStop = () => setIsAudioPlaying(false);
    
    const onEnded = () => {
      if (currentRepetitionRef.current < repeatCount) {
        currentRepetitionRef.current++;
        audio.currentTime = 0;
        audio.play().catch(onPlaybackError);
      } else {
        onStop();
      }
    };

    const onPlaybackError = () => {
      setError(prev => ({...prev, general: "Could not play the recitation audio."}));
      onStop();
    };

    audio.onpause = onStop;
    audio.onended = onEnded;
    audio.onerror = onPlaybackError;

    audio.play().catch(onPlaybackError);
  };

  const handleReadTafsir = async () => {
    if (tafsirData) {
      setTafsirData(null);
      setError(prev => ({ ...prev, tafsir: '' }));
      return;
    }
    if (!selectedSurah) return;
    setIsLoading(prev => ({ ...prev, tafsir: true }));
    setError(prev => ({ ...prev, tafsir: '' }));
    try {
      const response = await getTafsirForVerse(selectedSurah.surahNumber, selectedAyah);
      setTafsirData(response.tafsirs);
      if (response.tafsirs.length > 0) {
        setActiveTafsirAuthor(response.tafsirs[0].author);
      }
    } catch (err: any) {
      setError(prev => ({ ...prev, tafsir: err.message }));
    } finally {
      setIsLoading(prev => ({ ...prev, tafsir: false }));
    }
  };

  const handleSurahChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSurah = surahs.find(s => s.surahNumber === parseInt(e.target.value)) || null;
    setSelectedSurah(newSurah);
    setSelectedAyah(1); // Reset ayah to 1
    audioRef.current?.pause(); // Stop audio on verse change
  };

  const AyahSelector = () => {
    if (!selectedSurah) return null;
    return (
      <select
        id="ayah-select"
        value={selectedAyah}
        onChange={(e) => setSelectedAyah(parseInt(e.target.value))}
        disabled={!selectedSurah}
        className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition"
      >
        {Array.from({ length: selectedSurah.totalAyah }, (_, i) => i + 1).map(ayahNum => (
          <option key={ayahNum} value={ayahNum}>Ayah {ayahNum}</option>
        ))}
      </select>
    );
  };

  return (
    <div className="space-y-6 overflow-y-auto p-1 h-full">
      <Card>
        <h2 className="text-xl font-semibold text-islamic-green-dark mb-4">Practice Your Recitation</h2>
        {isLoading.surahs ? <div className="flex justify-center"><Loader /></div> : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="surah-select" className="block text-sm font-medium text-stone-600 mb-2">Select Surah:</label>
                <select
                  id="surah-select"
                  value={selectedSurah?.surahNumber || ''}
                  onChange={handleSurahChange}
                  className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition"
                >
                  {surahs.map(surah => (
                    <option key={surah.surahNumber} value={surah.surahNumber}>{surah.surahNumber}. {surah.surahName} ({surah.surahNameArabic})</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ayah-select" className="block text-sm font-medium text-stone-600 mb-2">Select Ayah:</label>
                <AyahSelector />
              </div>
            </div>
            {!isLoading.verse && reciters.length > 0 && (
              <div>
                <label htmlFor="reciter-select" className="block text-sm font-medium text-stone-600 mb-2">Select Reciter:</label>
                <select
                  id="reciter-select"
                  value={selectedReciter?.id || ''}
                  onChange={(e) => {
                      const reciterId = e.target.value;
                      const reciter = reciters.find(r => r.id === reciterId) || null;
                      setSelectedReciter(reciter);
                      setSelectedReciterId(reciterId);
                  }}
                  className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition"
                >
                  {reciters.map(reciter => (
                      <option key={reciter.id} value={reciter.id}>{reciter.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </Card>
      
      <Card>
        {isLoading.verse ? (
          <div className="text-center space-y-4 py-8">
            <SkeletonLoader className="h-10 w-full" />
            <SkeletonLoader className="h-6 w-3/4 mx-auto" />
          </div>
        ) : (
          currentVerse ? (
            <div className="text-center space-y-4">
                <p className="font-amiri text-4xl leading-relaxed text-stone-900" dir="rtl">{currentVerse.arabic}</p>
                <p className="text-stone-500">{currentVerse.english}</p>
                <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
                     <div className="flex items-center rounded-lg shadow-sm bg-islamic-green-light">
                        <button onClick={handlePlayRecitation} disabled={isLoading.verse || !selectedReciter} className="flex items-center space-x-2 px-4 py-2 text-white rounded-l-lg hover:bg-islamic-green transition disabled:bg-opacity-50">
                            {isAudioPlaying ? <StopIcon className="w-5 h-5"/> : <SpeakerIcon className="w-5 h-5"/>}
                            <span>{isAudioPlaying ? 'Stop' : 'Listen'}</span>
                        </button>
                        <select
                            value={repeatCount}
                            onChange={(e) => setRepeatCount(Number(e.target.value))}
                            disabled={isLoading.verse || !selectedReciter || isAudioPlaying}
                            className="py-2 pl-2 pr-8 border-l border-islamic-green-dark bg-transparent text-white focus:outline-none focus:ring-0 disabled:opacity-70"
                            aria-label="Repeat recitation count"
                        >
                            <option value={1}>1x</option>
                            <option value={3}>3x</option>
                            <option value={5}>5x</option>
                        </select>
                     </div>
                     {isSpeechSupported && (
                        <button onClick={handleReciteClick} disabled={isLoading.verse} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition shadow-sm ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-islamic-green hover:bg-islamic-green-dark'} text-white disabled:bg-opacity-50`}>
                            <MicIcon className="w-5 h-5"/>
                            <span>{isListening ? 'Stop Reciting' : 'Recite Now'}</span>
                        </button>
                     )}
                     <button onClick={handleReadTafsir} disabled={isLoading.verse || isLoading.tafsir} className="flex items-center space-x-2 px-4 py-2 bg-stone-500 text-white rounded-lg hover:bg-stone-600 transition shadow-sm disabled:bg-stone-400">
                        <BookOpenIcon className="w-5 h-5"/>
                        <span>{isLoading.tafsir ? 'Loading...' : tafsirData ? 'Hide Tafsir' : 'Read Tafsir'}</span>
                     </button>
                </div>
                {!isSpeechSupported && <p className="text-yellow-600 text-sm mt-4">Speech recognition is not supported in your browser.</p>}
            </div>
          ) : (
             <p className="text-center text-stone-500">
              {error.general ? `Error: ${error.general}` : 'Select a Surah and Ayah to begin.'}
            </p>
          )
        )}
      </Card>

      {(isLoading.tafsir || error.tafsir || tafsirData) && (
        <Card>
            {isLoading.tafsir && <div className="flex justify-center"><Loader /></div>}
            {error.tafsir && <p className="text-red-600 text-center">{error.tafsir}</p>}
            {tafsirData && (
                <div>
                    <h3 className="text-xl font-semibold text-islamic-green-dark mb-4">Tafsir for Ayah {selectedAyah}</h3>
                    <div className="border-b border-stone-200">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            {tafsirData.map(tafsir => (
                                <button
                                    key={tafsir.author}
                                    onClick={() => setActiveTafsirAuthor(tafsir.author)}
                                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTafsirAuthor === tafsir.author
                                            ? 'border-islamic-green text-islamic-green-dark'
                                            : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                                    }`}
                                >
                                    {tafsir.author}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="mt-4">
                        {tafsirData.map(tafsir => (
                            <div key={tafsir.author} className={activeTafsirAuthor === tafsir.author ? '' : 'hidden'}>
                                {tafsir.groupVerse && (
                                    <p className="text-sm text-stone-500 italic bg-stone-100 p-2 rounded-md mb-4">{tafsir.groupVerse}</p>
                                )}
                                <div className="prose prose-stone max-w-none leading-relaxed prose-p:my-4 prose-ul:my-4 prose-headings:mt-6 prose-headings:mb-3">
                                    <ReactMarkdown>{tafsir.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
      )}

      {isListening && <p className="text-center text-lg text-islamic-green animate-pulse">Listening...</p>}

      {isLoading.feedback && <div className="flex justify-center"><Loader /></div>}

      {error.general && !isLoading.verse && <Card><p className="text-red-600 text-center">{error.general}</p></Card>}

      {feedback && currentVerse && (
        <Card>
          <h3 className="text-xl font-semibold text-islamic-green-dark mb-4">Feedback on Your Recitation</h3>
          <VisualFeedback verse={currentVerse.arabic} feedbackData={feedback} />
        </Card>
      )}

      {selectedHistoryItem && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-islamic-green-dark">
              Feedback for {selectedHistoryItem.surahName} ({selectedHistoryItem.surahNumber}:{selectedHistoryItem.ayahNumber})
            </h3>
            <button
              onClick={() => setSelectedHistoryItem(null)}
              className="text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              Close
            </button>
          </div>
          <VisualFeedback verse={selectedHistoryItem.verseArabic} feedbackData={selectedHistoryItem.feedback} />
        </Card>
      )}
      
      {history.length > 0 && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-islamic-green-dark">Recitation History</h3>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {history.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setFeedback(null); // Hide live feedback when viewing history
                  setSelectedHistoryItem(item);
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedHistoryItem?.id === item.id ? 'bg-islamic-gold-light/60 ring-2 ring-islamic-gold' : 'bg-stone-50 hover:bg-stone-100'
                }`}
              >
                <div className="font-semibold text-stone-800">
                  {item.surahName} - Ayah {item.ayahNumber}
                </div>
                <div className="text-sm text-stone-500">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TajweedView;