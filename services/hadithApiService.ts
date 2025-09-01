import { HadithApiResponse, ChaptersApiResponse } from '../types';

const API_BASE_URL = 'https://hadithapi.com/api/hadiths';
// Note: This API key is provided in the prompt's documentation for public use.
const API_KEY = '$2y$10$ReBjcU4A6Ki6Of6pc7Zy6dqhliufe1SUjkJ1nwUimAAGzoVO';

interface SearchParams {
  keyword?: string;
  bookSlug?: string;
  hadithNumber?: string;
  page?: number;
}

/**
 * Searches for Hadiths based on specified criteria.
 * @param params - The search parameters.
 * @returns A promise that resolves to the API response containing Hadiths.
 */
export const searchHadiths = async (params: SearchParams): Promise<HadithApiResponse> => {
  try {
    const queryParams = new URLSearchParams({
      apiKey: API_KEY,
      paginate: '10', // Get 10 results per page
    });

    if (params.keyword) {
      queryParams.append('hadithEnglish', params.keyword);
    }
    if (params.bookSlug) {
      queryParams.append('book', params.bookSlug);
    }
    if (params.hadithNumber) {
      queryParams.append('hadithNumber', params.hadithNumber);
    }
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    
    const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`);

    if (!response.ok) {
        if (response.status === 404) {
            // The API returns 404 when no results are found
            return { hadiths: { data: [], total: 0, per_page: 10, current_page: 1, last_page: 1, next_page_url: null, prev_page_url: null } };
        }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.hadiths || !Array.isArray(data.hadiths.data)) {
        throw new Error("Invalid API response format for Hadiths.");
    }
    
    return data;
  } catch (error) {
    console.error("Failed to fetch Hadiths:", error);
    throw new Error("Could not load Hadiths. Please check your network connection and try again.");
  }
};

/**
 * Fetches all chapters for a given Hadith book.
 * @param bookSlug - The slug of the book.
 * @returns A promise that resolves to the API response containing chapters.
 */
export const getChaptersForBook = async (bookSlug: string): Promise<ChaptersApiResponse> => {
  try {
    const queryParams = new URLSearchParams({
      apiKey: API_KEY,
    });
    
    const response = await fetch(`https://hadithapi.com/api/${bookSlug}/chapters?${queryParams.toString()}`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.chapters || !Array.isArray(data.chapters)) {
        throw new Error("Invalid API response format for Chapters.");
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to fetch chapters for ${bookSlug}:`, error);
    throw new Error(`Could not load chapters. Please check your network connection and try again.`);
  }
};

/**
 * Fetches Hadiths for a specific chapter of a book.
 * @param bookSlug - The slug of the book.
 * @param chapterNumber - The number of the chapter.
 * @param page - The page number for pagination.
 * @returns A promise that resolves to the API response containing Hadiths.
 */
export const getHadithsByChapter = async (bookSlug: string, chapterNumber: string, page = 1): Promise<HadithApiResponse> => {
  try {
    const queryParams = new URLSearchParams({
      apiKey: API_KEY,
      paginate: '10',
      book: bookSlug,
      chapter: chapterNumber,
      page: page.toString(),
    });

    const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`);
    
    if (!response.ok) {
        if (response.status === 404) {
             return { hadiths: { data: [], total: 0, per_page: 10, current_page: 1, last_page: 1, next_page_url: null, prev_page_url: null } };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.hadiths || !Array.isArray(data.hadiths.data)) {
        throw new Error("Invalid API response format for Hadiths.");
    }

    return data;
  } catch (error) {
    console.error(`Failed to fetch hadiths for chapter ${chapterNumber} of ${bookSlug}:`, error);
    throw new Error(`Could not load Hadiths for the selected chapter. Please try again.`);
  }
};