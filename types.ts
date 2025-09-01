
export type View = 'home' | 'study' | 'tajweed' | 'hadith' | 'prayer' | 'settings' | 'read';

export interface AppSettings {
  notificationsEnabled: boolean;
  notificationSound: 'default' | 'adhan';
  quietHours: {
    enabled: boolean;
    start: string; // "HH:mm"
    end: string; // "HH:mm"
  };
}

export interface SurahInfo {
  surahNumber: number;
  surahName: string;
  surahNameArabic: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
}

export interface Reciter {
  id: string;
  name: string;
  url: string;
}

export interface VerseData {
  arabic: string;
  english: string;
  reciters: Reciter[];
}

export interface Tafsir {
  author: string;
  groupVerse: string | null;
  content: string;
}

export interface TafsirResponse {
  surahName: string;
  surahNo: number;
  ayahNo: number;
  tafsirs: Tafsir[];
}

// New types for structured Tajweed feedback
export interface TajweedFeedbackItem {
  wordIndex: number;
  letter: string;
  makhrajKey: 'THROAT' | 'TONGUE' | 'LIPS' | 'NASAL';
  feedback: string;
}

export interface StructuredTajweedFeedback {
  encouragement: string;
  feedbackItems: TajweedFeedbackItem[];
  conclusion: string;
}

export interface RecitationHistoryItem {
  id: string;
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  verseArabic: string;
  feedback: StructuredTajweedFeedback;
  timestamp: string;
}

// New types for Hadith feature
export interface HadithBook {
    name: string;
    slug: string;
}

export interface Hadith {
    id: number;
    hadithNumber: string;
    englishNarrator: string;
    hadithEnglish: string;
    hadithUrdu: string;
    hadithArabic: string;
    chapterId: string;
    bookId: string;
    status?: string; // Added status for Hadith authenticity
    book: {
        bookName: string;
        writerName: string;
        aboutWriter: string;
        writerDeath: string;
    };
    chapter: {
        chapterNumber: string;
        chapterEnglish: string;
        chapterUrdu: string;
        chapterArabic: string;
    };
}

export interface HadithApiResponse {
    hadiths: {
        data: Hadith[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        next_page_url: string | null;
        prev_page_url: string | null;
    };
}

export interface Chapter {
    id: number;
    chapterNumber: string;
    chapterEnglish: string;
    chapterUrdu: string;
    chapterArabic: string;
    bookSlug: string;
}

export interface ChaptersApiResponse {
    chapters: Chapter[];
}

export interface VerseOfTheDayData {
  arabic: string;
  english: string;
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
}

// New types for Prayer Times feature
export interface PrayerTimes {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
}

export interface PrayerTimesApiResponse {
    code: number;
    status: string;
    data: {
        timings: PrayerTimes;
    };
}

// New types for Qibla direction
export interface QiblaData {
    latitude: number;
    longitude: number;
    direction: number;
}

export interface QiblaApiResponse {
    code: number;
    status: string;
    data: QiblaData;
}

// New types for Quran Reader
export interface Ayah {
    id: number;
    text: string;
    translation_en: string;
}

export interface FullSurah {
    id: number;
    name: string;
    transliteration: string;
    translation: string;
    type: string;
    total_verses: number;
    verses: Ayah[];
}

// New type for App Context
export interface AppContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
  practiceVerse: { surahNumber: number; ayahNumber: number } | null;
  handleResumePractice: (surahNumber: number, ayahNumber: number) => void;
  settings: AppSettings;
  saveSettings: (newSettings: Partial<AppSettings>) => void;
  prayerTimes: PrayerTimes | null;
  qiblaDirection: number | null;
  isLoadingLocationData: boolean;
  locationError: string | null;
}