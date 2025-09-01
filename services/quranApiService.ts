import { SurahInfo, VerseData, Reciter, TafsirResponse, FullSurah, Ayah, SearchResult, VerseOfTheDayData } from '../types';

const API_BASE_URL = 'https://quranapi.pages.dev/api';
const QURAN_CACHE_KEY = 'fullQuranDataV3';

// Unified cache for all Quran data (full surahs)
const quranDataCache: Map<number, FullSurah> = new Map();
let isFullQuranInLocalStorage = false;
let isQuranLoading = false;

/**
 * Fetches a list of all Surahs from the Quran API.
 * @returns A promise that resolves to an array of SurahInfo objects.
 */
export const getAllSurahs = async (): Promise<SurahInfo[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/surah.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.map((surah: Omit<SurahInfo, 'surahNumber'>, index: number) => ({
      ...surah,
      surahNumber: index + 1,
    }));
  } catch (error) {
    console.error("Failed to fetch Surahs:", error);
    throw new Error("Could not load the list of Surahs. Please check your network connection and try again.");
  }
};

/**
 * Fetches the Arabic and English text for a specific Quranic verse, along with available reciters.
 * @param surahNumber - The chapter number (1-114).
 * @param ayahNumber - The verse number.
 * @returns A promise that resolves to an object containing the arabic text, english text, and a list of reciters.
 */
export const getVerse = async (surahNumber: number, ayahNumber: number): Promise<VerseData> => {
    try {
        const response = await fetch(`${API_BASE_URL}/${surahNumber}/${ayahNumber}.json`);
        if (!response.ok) {
            if (response.status === 404) {
                 throw new Error(`Verse ${ayahNumber} does not exist in Surah ${surahNumber}.`);
            }
            throw new Error(`Network error: ${response.statusText}`);
        }
        const json = await response.json();

        if (!json.arabic1 || !json.english || !json.audio) {
             throw new Error("Invalid API response format for verse.");
        }

        const reciters: Reciter[] = Object.entries(json.audio).map(([id, reciterData]: [string, any]) => ({
            id,
            name: reciterData.reciter,
            url: reciterData.url,
        }));
        
        return {
            arabic: json.arabic1,
            english: json.english,
            reciters: reciters,
        };
    } catch (error) {
        console.error(`Failed to fetch verse ${surahNumber}:${ayahNumber}:`, error);
        throw new Error(`Could not load the selected verse. ${error instanceof Error ? error.message : ''}`);
    }
}

/**
 * Fetches Tafsir for a specific Quranic verse.
 * @param surahNumber - The chapter number.
 * @param ayahNumber - The verse number.
 * @returns A promise that resolves to an object containing the tafsirs.
 */
export const getTafsirForVerse = async (surahNumber: number, ayahNumber: number): Promise<TafsirResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/tafsir/${surahNumber}_${ayahNumber}.json`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Tafsir for this specific verse is not available in the database.");
            }
            throw new Error(`Network error: ${response.statusText}`);
        }
        const json: TafsirResponse = await response.json();
        if (!json.tafsirs || json.tafsirs.length === 0) {
            throw new Error("Invalid or empty Tafsir data received from API.");
        }
        return json;
    } catch (error) {
        console.error(`Failed to fetch Tafsir for ${surahNumber}:${ayahNumber}:`, error);
        if (error instanceof Error) {
             throw new Error(error.message);
        }
        throw new Error("Could not load the Tafsir. Please try again.");
    }
}


/**
 * Fetches all verses for a specific Surah.
 * Prioritizes in-memory cache, then falls back to network fetch.
 * @param surahNumber The chapter number.
 * @returns A promise that resolves to an object containing the full Surah data.
 */
export const getSurah = async (surahNumber: number): Promise<FullSurah> => {
    if (quranDataCache.has(surahNumber)) {
        return quranDataCache.get(surahNumber)!;
    }

    try {
        const allSurahsInfo = await getAllSurahs();
        const surahInfo = allSurahsInfo.find(s => s.surahNumber === surahNumber);

        if (!surahInfo) throw new Error(`Surah with number ${surahNumber} not found.`);

        const versePromises = Array.from({ length: surahInfo.totalAyah }, (_, i) => {
            const ayahNumber = i + 1;
            return getVerse(surahNumber, ayahNumber).then(verseData => ({
                id: ayahNumber,
                text: verseData.arabic,
                translation_en: verseData.english,
                reciters: verseData.reciters,
            }));
        });

        const verses: Ayah[] = await Promise.all(versePromises);
        if (!verses || verses.length === 0) throw new Error("Failed to construct surah data with verses.");

        const fullSurah: FullSurah = {
            id: surahInfo.surahNumber,
            name: surahInfo.surahNameArabic,
            transliteration: surahInfo.surahName,
            translation: surahInfo.surahNameTranslation,
            type: surahInfo.revelationPlace.toLowerCase(),
            total_verses: surahInfo.totalAyah,
            verses: verses,
        };

        quranDataCache.set(surahNumber, fullSurah);
        return fullSurah;
    } catch (error) {
         console.error(`Failed to fetch Surah ${surahNumber}:`, error);
         throw new Error(`Could not load the Surah. ${error instanceof Error ? error.message : ''}`);
    }
};

/**
 * Checks if the full Quran data is ready for searching.
 * @returns {boolean} True if data is loaded, false otherwise.
 */
export const isQuranDataReady = (): boolean => isFullQuranInLocalStorage || quranDataCache.size === 114;

/**
 * Prepares the full Quran data for searching by downloading it if not already cached.
 * @param onProgress - A callback function to report download progress (0-100).
 */
export const prepareFullQuranData = async (onProgress: (progress: number) => void): Promise<void> => {
    if (isQuranDataReady() || isQuranLoading) return;
    isQuranLoading = true;

    try {
        const cachedData = localStorage.getItem(QURAN_CACHE_KEY);
        if (cachedData) {
            const parsedData: FullSurah[] = JSON.parse(cachedData);
            parsedData.forEach(surah => quranDataCache.set(surah.id, surah));
            isFullQuranInLocalStorage = true;
            onProgress(100);
            return;
        }
    } catch (e) {
        console.error("Failed to load full Quran from cache", e);
    }

    try {
        const allSurahsInfo = await getAllSurahs();
        for (let i = 0; i < allSurahsInfo.length; i++) {
            const info = allSurahsInfo[i];
            await getSurah(info.surahNumber); // getSurah will fetch and populate the cache
            const progress = Math.round(((i + 1) / allSurahsInfo.length) * 100);
            onProgress(progress);
        }
        
        try {
             localStorage.setItem(QURAN_CACHE_KEY, JSON.stringify(Array.from(quranDataCache.values())));
             isFullQuranInLocalStorage = true;
        } catch (e) {
            console.warn("Could not cache full Quran data, likely due to storage limits.", e);
        }
    } catch (err) {
        console.error("Error preparing full Quran data:", err);
        throw err;
    } finally {
        isQuranLoading = false;
    }
};

/**
 * Searches the loaded Quran data.
 * @param query - The search term (English or Arabic).
 * @returns An array of search results.
 */
export const searchQuran = (query: string): SearchResult[] => {
    if (!isQuranDataReady() || query.trim().length < 3) {
        return [];
    }
    
    const searchResults: SearchResult[] = [];
    const lowerCaseQuery = query.toLowerCase();
    const arabicRegex = /[\u0600-\u06FF]/;
    const isArabicQuery = arabicRegex.test(query);

    for (const surah of quranDataCache.values()) {
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
    return searchResults;
};


/**
 * Fetches a random verse from the Quran.
 * @returns A promise that resolves to an object containing the verse and its surah info.
 */
export const getRandomVerse = async (): Promise<VerseOfTheDayData> => {
    try {
        const allSurahs = await getAllSurahs();
        const randomSurah = allSurahs[Math.floor(Math.random() * allSurahs.length)];
        const randomAyahNumber = Math.floor(Math.random() * randomSurah.totalAyah) + 1;
        const verseData = await getVerse(randomSurah.surahNumber, randomAyahNumber);

        return {
            arabic: verseData.arabic,
            english: verseData.english,
            surahName: randomSurah.surahName,
            surahNumber: randomSurah.surahNumber,
            ayahNumber: randomAyahNumber,
        };

    } catch (error) {
        console.error("Failed to fetch random verse:", error);
        throw new Error("Could not load a Verse of the Day. Please check your network connection and try again.");
    }
};
