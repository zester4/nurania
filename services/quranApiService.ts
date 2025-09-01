import { SurahInfo, VerseData, Reciter, TafsirResponse, VerseOfTheDayData, FullSurah, Ayah } from '../types';

const API_BASE_URL = 'https://quranapi.pages.dev/api';

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
 * Fetches all verses for a specific Surah by aggregating individual verse calls.
 * @param surahNumber The chapter number.
 * @returns A promise that resolves to an object containing the full Surah data.
 */
export const getSurah = async (surahNumber: number): Promise<FullSurah> => {
    try {
        // Get all surah metadata to find the one we need, including its total verses.
        const allSurahs = await getAllSurahs();
        const surahInfo = allSurahs.find(s => s.surahNumber === surahNumber);

        if (!surahInfo) {
            throw new Error(`Surah with number ${surahNumber} not found.`);
        }

        // Create an array of promises for fetching each verse of the surah.
        const versePromises = Array.from({ length: surahInfo.totalAyah }, (_, i) => {
            const ayahNumber = i + 1;
            return getVerse(surahNumber, ayahNumber).then(verseData => ({
                id: ayahNumber,
                text: verseData.arabic,
                translation_en: verseData.english,
            }));
        });

        // Fetch all verses in parallel.
        const verses: Ayah[] = await Promise.all(versePromises);
        
        if (!verses || verses.length === 0) {
            throw new Error("Failed to construct surah data with verses.");
        }

        // Construct the FullSurah object.
        const fullSurah: FullSurah = {
            id: surahInfo.surahNumber,
            name: surahInfo.surahNameArabic,
            transliteration: surahInfo.surahName,
            translation: surahInfo.surahNameTranslation,
            type: surahInfo.revelationPlace.toLowerCase(),
            total_verses: surahInfo.totalAyah,
            verses: verses,
        };

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
        // First, get the list of all surahs to know their lengths
        const allSurahs = await getAllSurahs();

        // Pick a random surah
        const randomSurah = allSurahs[Math.floor(Math.random() * allSurahs.length)];
        
        // Pick a random ayah from that surah
        const randomAyahNumber = Math.floor(Math.random() * randomSurah.totalAyah) + 1;

        // Fetch the specific verse data
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