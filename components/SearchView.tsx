import React, { useState, useEffect, useCallback } from 'react';
import { FullSurah, SearchResult } from '../types';
import { getAllSurahs, getSurah } from '../services/quranApiService';
import { Card } from './common/Card';
import { SkeletonLoader } from './common/SkeletonLoader';
import { useAppContext } from '../contexts/AppContext';

const QURAN_CACHE_KEY = 'fullQuranDataV2';
let fullQuranData: FullSurah[] | null = null;
let isQuranLoading = false;

const SearchView: React.FC = () => {
    const { handleGotoVerse } = useAppContext();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isDataReady, setIsDataReady] = useState(!!fullQuranData);

    const loadFullQuran = useCallback(async () => {
        if (fullQuranData || isQuranLoading) return;
        isQuranLoading = true;

        try {
            const cachedData = localStorage.getItem(QURAN_CACHE_KEY);
            if (cachedData) {
                fullQuranData = JSON.parse(cachedData);
                setLoadingProgress(100);
                setIsDataReady(true);
                return;
            }
        } catch (e) { console.error("Failed to load full Quran from cache", e); }

        try {
            const allSurahsInfo = await getAllSurahs();
            const tempQuranData: FullSurah[] = [];
            for (let i = 0; i < allSurahsInfo.length; i++) {
                const info = allSurahsInfo[i];
                const surah = await getSurah(info.surahNumber);
                tempQuranData.push(surah);
                const progress = Math.round(((i + 1) / allSurahsInfo.length) * 100);
                setLoadingProgress(progress);
            }
            fullQuranData = tempQuranData.sort((a, b) => a.id - b.id);
            setIsDataReady(true);

            try {
                // Clean up old individual surah caches to make space
                Object.keys(localStorage)
                  .filter(key => key.startsWith('surah_'))
                  .forEach(key => localStorage.removeItem(key));
                  
                localStorage.setItem(QURAN_CACHE_KEY, JSON.stringify(fullQuranData));
            } catch (e) {
                console.warn("Could not cache full Quran data, likely due to storage limits. Search is available, but data will be re-downloaded on next visit.", e);
            }
        } catch (err: any) {
            setError(err.message || "Failed to download Quran data.");
        } finally {
            isQuranLoading = false;
        }
    }, []);

    useEffect(() => {
        if (!isDataReady) {
            loadFullQuran();
        }
    }, [isDataReady, loadFullQuran]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullQuranData || query.trim().length < 3) {
            setResults([]);
            return;
        }

        const searchResults: SearchResult[] = [];
        const lowerCaseQuery = query.toLowerCase();
        const arabicRegex = /[\u0600-\u06FF]/;
        const isArabicQuery = arabicRegex.test(query);

        for (const surah of fullQuranData) {
            for (const ayah of surah.verses) {
                const englishMatch = !isArabicQuery && ayah.translation_en.toLowerCase().includes(lowerCaseQuery);
                const arabicMatch = isArabicQuery && ayah.text.includes(query);

                if (englishMatch || arabicMatch) {
                    searchResults.push({
                        surahNumber: surah.id,
                        surahName: surah.transliteration,
                        ayahNumber: ayah.id,
                        arabic: ayah.text,
                        english: ayah.translation_en,
                    });
                }
            }
        }
        setResults(searchResults);
    };

    const ResultCard: React.FC<{ result: SearchResult }> = ({ result }) => (
        <button
            onClick={() => handleGotoVerse(result.surahNumber, result.ayahNumber)}
            className="w-full text-left p-4 rounded-lg transition-colors bg-stone-50 hover:bg-islamic-gold-light/40 border border-stone-200"
        >
            <p className="font-semibold text-islamic-green-dark mb-2">
                {result.surahName} ({result.surahNumber}:{result.ayahNumber})
            </p>
            <p className="font-amiri text-2xl text-right leading-loose mb-3" dir="rtl">{result.arabic}</p>
            <p className="text-stone-600 text-sm italic">"{result.english}"</p>
        </button>
    );

    return (
        <div className="space-y-6 overflow-y-auto p-1 h-full">
            <Card>
                <h2 className="text-xl font-semibold text-islamic-green-dark mb-2">Search the Quran</h2>
                <p className="text-stone-600 mb-4">Find verses by searching in English or Arabic.</p>
                {!isDataReady ? (
                    <div className="space-y-3 text-center">
                        <p className="text-stone-600 font-medium">Preparing search data for the first time...</p>
                        <div className="w-full bg-stone-200 rounded-full h-2.5">
                            <div className="bg-islamic-green h-2.5 rounded-full" style={{ width: `${loadingProgress}%` }}></div>
                        </div>
                        <p className="text-sm text-stone-500">{loadingProgress}% Complete</p>
                    </div>
                ) : (
                    <form onSubmit={handleSearch} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., mercy, الصلاة"
                            className="w-full p-3 bg-stone-100 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-1 focus:ring-islamic-green focus:outline-none transition"
                        />
                        <button type="submit" className="px-4 py-3 bg-islamic-green text-white font-semibold rounded-lg hover:bg-islamic-green-dark transition shadow-sm">Search</button>
                    </form>
                )}
            </Card>

            {error && <Card><p className="text-red-600 text-center">{error}</p></Card>}

            <div className="space-y-4">
                {results.length > 0 ? (
                    results.map((res, i) => <ResultCard key={`${res.surahNumber}-${res.ayahNumber}-${i}`} result={res} />)
                ) : (
                    query.trim().length >= 3 && <Card><p className="text-center text-stone-500">No results found.</p></Card>
                )}
            </div>
        </div>
    );
};

export default SearchView;