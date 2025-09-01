import { SurahInfo, VerseData, Reciter, TafsirResponse, VerseOfTheDayData, FullSurah, Ayah } from '../types';

const API_BASE_URL = 'https://quranapi.pages.dev/api';
const QURAN_CACHE_KEY = 'fullQuranDataV2'; // From SearchView
const surahCache: Record<number, FullSurah> = {};


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
    // Add surahNumber to each object, as it's not in the API response
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
            arabic: json.arabic1, // Using arabic1 for text with diacritics
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
 * It prioritizes cache sources: in-memory -> full Quran localStorage -> legacy individual surah localStorage -> network.
 * It only writes to the in-memory cache to avoid storage quota issues.
 * @param surahNumber The chapter number.
 * @returns A promise that resolves to an object containing the full Surah data.
 */
export const getSurah = async (surahNumber: number): Promise<FullSurah> => {
    // 1. Check in-memory cache first
    if (surahCache[surahNumber]) return surahCache[surahNumber];

    // 2. Check if the full Quran is cached in localStorage from the SearchView
    try {
        const cachedFullQuran = localStorage.getItem(QURAN_CACHE_KEY);
        if (cachedFullQuran) {
            const allSurahs: FullSurah[] = JSON.parse(cachedFullQuran);
            allSurahs.forEach(surah => {
                surahCache[surah.id] = surah;
            });
            if (surahCache[surahNumber]) {
                return surahCache[surahNumber];
            }
        }
    } catch (e) {
        console.error("Failed to read full Quran from localStorage", e);
    }
    
    // 3. Check for legacy individual surah cache (read-only for backward compatibility)
    try {
        const legacyCacheKey = `surah_${surahNumber}`;
        const cachedSurah = localStorage.getItem(legacyCacheKey);
        if (cachedSurah) {
            const parsed = JSON.parse(cachedSurah);
            surahCache[surahNumber] = parsed;
            return parsed;
        }
    } catch (e) {
        console.error(`Failed to read legacy surah ${surahNumber} from localStorage`, e);
    }

    // 4. If not in any cache, fetch from network
    try {
        const allSurahsInfo = await getAllSurahs();
        const surahInfo = allSurahsInfo.find(s => s.surahNumber === surahNumber);

        if (!surahInfo) {
            throw new Error(`Surah with number ${surahNumber} not found.`);
        }

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
        
        if (!verses || verses.length === 0) {
            throw new Error("Failed to construct surah data with verses.");
        }

        const fullSurah: FullSurah = {
            id: surahInfo.surahNumber,
            name: surahInfo.surahNameArabic,
            transliteration: surahInfo.surahName,
            translation: surahInfo.surahNameTranslation,
            type: surahInfo.revelationPlace.toLowerCase(),
            total_verses: surahInfo.totalAyah,
            verses: verses,
        };

        // Put it in the in-memory cache for this session
        surahCache[surahNumber] = fullSurah;
        
        return fullSurah;
    } catch (error) {
         console.error(`Failed to fetch Surah ${surahNumber}:`, error);
         throw new Error(`Could not load the Surah. ${error instanceof Error ? error.message : ''}`);
    }
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