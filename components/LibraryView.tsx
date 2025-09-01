import React, { useState, useEffect } from 'react';
import { Hadith, HadithApiResponse, Chapter, BookmarkedVerse } from '../types';
import { searchHadiths, getChaptersForBook, getHadithsByChapter } from '../services/hadithApiService';
import { HADITH_BOOKS } from '../constants';
import { Card } from './common/Card';
import { IconButton, BookmarkIcon, BookmarkFilledIcon } from './common/IconButton';
import { useBookmarkedHadiths } from '../hooks/useBookmarkedHadiths';
import { useBookmarkedVerses } from '../hooks/useBookmarkedVerses';
import { SkeletonLoader } from './common/SkeletonLoader';
import { useAppContext } from '../contexts/AppContext';
import { useLastViewedHadith } from '../hooks/useLastViewedHadith';

type LibraryTab = 'hadithSearch' | 'hadithBrowse' | 'hadithBookmarks' | 'quranBookmarks';

interface LibraryViewProps {
  initialHadith: { bookSlug: string; chapter: Chapter } | null;
  onViewMounted: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ initialHadith, onViewMounted }) => {
    const { handleGotoVerse } = useAppContext();
    const { bookmarkedHadiths, addBookmark: addHadithBookmark, removeBookmark: removeHadithBookmark, isBookmarked: isHadithBookmarked } = useBookmarkedHadiths();
    const { bookmarkedVerses, removeBookmark: removeVerseBookmark } = useBookmarkedVerses();
    const { saveLastViewedHadith } = useLastViewedHadith();

    const [activeTab, setActiveTab] = useState<LibraryTab>('hadithSearch');
    
    // Hadith Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [hadithNumber, setHadithNumber] = useState('');
    const [selectedBook, setSelectedBook] = useState('');
    const [searchResults, setSearchResults] = useState<HadithApiResponse | null>(null);
    const [searchIsLoading, setSearchIsLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Hadith Browse State
    const [browseSelectedBook, setBrowseSelectedBook] = useState<string>('sahih-bukhari');
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [chapterHadiths, setChapterHadiths] = useState<HadithApiResponse | null>(null);
    const [browseIsLoading, setBrowseIsLoading] = useState<'chapters' | 'hadiths' | false>(false);
    const [browseError, setBrowseError] = useState<string | null>(null);
    
    useEffect(() => {
        if (initialHadith) {
            setActiveTab('hadithBrowse');
            setBrowseSelectedBook(initialHadith.bookSlug);
            // This will trigger the chapter fetch, and then we set the selected chapter.
        }
    }, [initialHadith]);

    useEffect(() => {
        if (activeTab !== 'hadithBrowse') return;

        const fetchChapters = async () => {
            setBrowseIsLoading('chapters');
            setBrowseError(null);
            setChapters([]);
            setSelectedChapter(null);
            setChapterHadiths(null);
            try {
                const response = await getChaptersForBook(browseSelectedBook);
                setChapters(response.chapters);

                // If navigating from home, select the chapter after they've loaded
                if (initialHadith && initialHadith.bookSlug === browseSelectedBook) {
                    const chapterToSelect = response.chapters.find(c => c.id === initialHadith.chapter.id);
                    if (chapterToSelect) {
                        handleSelectChapter(chapterToSelect);
                    }
                    onViewMounted(); // Signal that we've handled the prop
                }
            } catch (err: any) {
                setBrowseError(err.message);
            } finally {
                setBrowseIsLoading(false);
            }
        };
        fetchChapters();
    }, [browseSelectedBook, activeTab, initialHadith, onViewMounted]);

    const handleSearch = async (page = 1) => {
        if (!searchTerm.trim() && !selectedBook && !hadithNumber.trim()) {
            setSearchError('Please enter a search term, number, or select a book.');
            return;
        }
        setSearchIsLoading(true);
        setSearchError(null);
        if (page === 1) setSearchResults(null);
        try {
            const response = await searchHadiths({ keyword: searchTerm, bookSlug: selectedBook, hadithNumber, page });
            setSearchResults(response);
            if (response.hadiths.data.length === 0 && page === 1) {
                setSearchError('No Hadiths found matching your criteria.');
            }
        } catch (err: any) {
            setSearchError(err.message || 'An unexpected error occurred.');
        } finally {
            setSearchIsLoading(false);
        }
    };

    const handleSelectChapter = async (chapter: Chapter, page = 1) => {
        saveLastViewedHadith(browseSelectedBook, chapter);
        setSelectedChapter(chapter);
        setBrowseIsLoading('hadiths');
        setBrowseError(null);
        if (page === 1) setChapterHadiths(null);
        try {
            const response = await getHadithsByChapter(browseSelectedBook, chapter.chapterNumber, page);
            setChapterHadiths(response);
        } catch (err: any) {
            setBrowseError(err.message);
        } finally {
            setBrowseIsLoading(false);
        }
    };

    const HadithCard: React.FC<{ hadith: Hadith }> = ({ hadith }) => {
        const getStatusBadgeColor = (status?: string) => {
            if (!status) return 'bg-stone-200 text-stone-700';
            const lowerStatus = status.toLowerCase();
            if (lowerStatus.includes('sahih')) return 'bg-islamic-green text-white';
            if (lowerStatus.includes('hasan')) return 'bg-yellow-500 text-white';
            if (lowerStatus.includes('da\'eef') || lowerStatus.includes('daeef')) return 'bg-red-600 text-white';
            return 'bg-stone-400 text-white';
        };
        const bookmarked = isHadithBookmarked(hadith.id);
        return (
            <Card className="mb-4">
                <div className="border-b border-stone-200 pb-3 mb-3">
                   <div className="flex justify-between items-start">
                        <div className="flex-grow pr-4">
                            <p className="font-semibold text-islamic-green-dark">
                                {hadith.book.bookName} - Hadith {hadith.hadithNumber}
                            </p>
                            <p className="text-sm text-stone-500 mt-1">{hadith.chapter.chapterEnglish}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                             {hadith.status && (
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full whitespace-nowrap ${getStatusBadgeColor(hadith.status)}`}>
                                    {hadith.status}
                                </span>
                            )}
                            <IconButton onClick={() => bookmarked ? removeHadithBookmark(hadith.id) : addHadithBookmark(hadith)} aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}>
                                {bookmarked ? <BookmarkFilledIcon className="w-5 h-5 text-islamic-gold" /> : <BookmarkIcon className="w-5 h-5" />}
                            </IconButton>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <p className="text-stone-700 leading-relaxed">{hadith.hadithEnglish}</p>
                    <p className="font-amiri text-2xl text-right leading-loose" dir="rtl">{hadith.hadithArabic}</p>
                </div>
            </Card>
        );
    };

    const QuranBookmarkCard: React.FC<{ verse: BookmarkedVerse }> = ({ verse }) => (
        <Card className="mb-4">
            <div className="border-b border-stone-200 pb-3 mb-3">
                <div className="flex justify-between items-start">
                    <button 
                        onClick={() => handleGotoVerse(verse.surahNumber, verse.ayahNumber)}
                        className="flex-grow pr-4 text-left hover:text-islamic-green-dark transition"
                    >
                        <p className="font-semibold">
                            {verse.surahName} ({verse.surahNumber}:{verse.ayahNumber})
                        </p>
                    </button>
                    <IconButton onClick={() => removeVerseBookmark(verse.surahNumber, verse.ayahNumber)} aria-label="Remove bookmark">
                        <BookmarkFilledIcon className="w-5 h-5 text-islamic-gold" />
                    </IconButton>
                </div>
            </div>
            <div className="space-y-4">
                <p className="text-stone-700 leading-relaxed">{verse.english}</p>
                <p className="font-amiri text-2xl text-right leading-loose" dir="rtl">{verse.arabic}</p>
            </div>
        </Card>
    );

    const HadithCardSkeleton: React.FC = () => (
        <Card className="mb-4"><div className="space-y-3"><SkeletonLoader className="h-5 w-1/2" /><SkeletonLoader className="h-4 w-3/4" /><SkeletonLoader className="h-4 w-full mt-4" /><SkeletonLoader className="h-4 w-5/6" /><SkeletonLoader className="h-8 w-full mt-4" /></div></Card>
    );
    
    const ChapterListSkeleton: React.FC = () => <div className="space-y-2">{[...Array(8)].map((_, i) => <SkeletonLoader key={i} className="h-12 w-full rounded-lg" />)}</div>;

    const renderPagination = (data: HadithApiResponse, handler: (page: number) => void, isLoading: boolean) => (
        data.hadiths.last_page > 1 && (
            <div className="flex justify-between items-center mt-6">
                <button onClick={() => handler(data.hadiths.current_page - 1)} disabled={!data.hadiths.prev_page_url || isLoading} className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition disabled:opacity-50">Previous</button>
                <span className="text-sm text-stone-500">Page {data.hadiths.current_page} of {data.hadiths.last_page}</span>
                <button onClick={() => handler(data.hadiths.current_page + 1)} disabled={!data.hadiths.next_page_url || isLoading} className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition disabled:opacity-50">Next</button>
            </div>
        )
    );
    
    const tabs: { id: LibraryTab; label: string; count?: number }[] = [
        { id: 'hadithSearch', label: 'Search Hadith' },
        { id: 'hadithBrowse', label: 'Browse Hadith' },
        { id: 'hadithBookmarks', label: 'Hadith Bookmarks', count: bookmarkedHadiths.length },
        { id: 'quranBookmarks', label: 'Quran Bookmarks', count: bookmarkedVerses.length },
    ];

    return (
        <div className="space-y-6 overflow-y-auto p-1 h-full">
            <Card>
                <div className="border-b border-stone-200">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-islamic-green text-islamic-green-dark' : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'}`}>
                                {tab.label} {typeof tab.count !== 'undefined' && `(${tab.count})`}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Hadith Search Tab */}
                <div className={`${activeTab === 'hadithSearch' ? 'block' : 'hidden'} mt-6`}>
                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(1); }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label htmlFor="search-term" className="block text-sm font-medium text-stone-600 mb-2">Keyword (English):</label><input id="search-term" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="e.g., prayer" className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition" /></div>
                            <div><label htmlFor="hadith-number" className="block text-sm font-medium text-stone-600 mb-2">Number:</label><input id="hadith-number" type="text" value={hadithNumber} onChange={(e) => setHadithNumber(e.target.value)} placeholder="e.g., 1" className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition" /></div>
                        </div>
                        <div><label htmlFor="book-select" className="block text-sm font-medium text-stone-600 mb-2">Book:</label><select id="book-select" value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)} className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition"><option value="">All Books</option>{HADITH_BOOKS.map(book => <option key={book.slug} value={book.slug}>{book.name}</option>)}</select></div>
                        <button type="submit" disabled={searchIsLoading} className="w-full px-4 py-3 bg-islamic-green text-white font-semibold rounded-lg hover:bg-islamic-green-dark transition shadow-sm disabled:bg-opacity-50 flex items-center justify-center">Search</button>
                    </form>
                </div>

                 {/* Hadith Browse Tab */}
                <div className={`${activeTab === 'hadithBrowse' ? 'block' : 'hidden'} mt-6`}>
                    {!selectedChapter ? (
                        <div className="space-y-4">
                            <div><label htmlFor="books-book-select" className="block text-sm font-medium text-stone-600 mb-2">Select Collection:</label><select id="books-book-select" value={browseSelectedBook} onChange={(e) => setBrowseSelectedBook(e.target.value)} className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition">{HADITH_BOOKS.map(book => <option key={book.slug} value={book.slug}>{book.name}</option>)}</select></div>
                            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">{browseIsLoading === 'chapters' ? <ChapterListSkeleton /> : chapters.map(chapter => (<button key={chapter.id} onClick={() => handleSelectChapter(chapter)} className="w-full text-left p-3 rounded-lg transition-colors bg-stone-50 hover:bg-stone-100 border border-stone-200"><p className="font-semibold text-stone-800">Chapter {chapter.chapterNumber}: {chapter.chapterEnglish}</p></button>))}</div>
                        </div>
                    ) : (
                        <div>
                            <button onClick={() => setSelectedChapter(null)} className="text-sm font-medium text-islamic-green-dark hover:underline mb-4">&larr; Back to Chapters</button>
                            <h3 className="text-lg font-bold text-islamic-green-dark mb-4">Chapter {selectedChapter.chapterNumber}: {selectedChapter.chapterEnglish}</h3>
                            {browseIsLoading === 'hadiths' && !chapterHadiths && Array.from({length: 3}).map((_, i) => <HadithCardSkeleton key={i} />)}
                            {chapterHadiths && chapterHadiths.hadiths.data.length > 0 && (<div>{chapterHadiths.hadiths.data.map(hadith => <HadithCard key={hadith.id} hadith={hadith} />)}{renderPagination(chapterHadiths, (page) => handleSelectChapter(selectedChapter, page), browseIsLoading === 'hadiths')}</div>)}
                            {chapterHadiths && chapterHadiths.hadiths.data.length === 0 && <p className="text-center text-stone-500">No hadiths found in this chapter.</p>}
                        </div>
                    )}
                </div>

            </Card>

            <div className={activeTab === 'hadithSearch' ? 'block' : 'hidden'}>
                {searchError && <Card><p className="text-red-600 text-center">{searchError}</p></Card>}
                {searchIsLoading && !searchResults && Array.from({length: 3}).map((_, i) => <HadithCardSkeleton key={i} />)}
                {searchResults && searchResults.hadiths.data.length > 0 && (<div>{searchResults.hadiths.data.map(hadith => <HadithCard key={hadith.id} hadith={hadith} />)}{renderPagination(searchResults, handleSearch, searchIsLoading)}</div>)}
            </div>

            <div className={activeTab === 'hadithBrowse' ? 'block' : 'hidden'}>
                {browseError && <Card><p className="text-red-600 text-center">{browseError}</p></Card>}
            </div>

            <div className={activeTab === 'hadithBookmarks' ? 'block' : 'hidden'}>
                {bookmarkedHadiths.length > 0 ? bookmarkedHadiths.map(hadith => <HadithCard key={hadith.id} hadith={hadith} />) : <Card><p className="text-center text-stone-500">You have no bookmarked Hadiths.</p></Card>}
            </div>

            <div className={activeTab === 'quranBookmarks' ? 'block' : 'hidden'}>
                {bookmarkedVerses.length > 0 ? bookmarkedVerses.map(verse => <QuranBookmarkCard key={`${verse.surahNumber}-${verse.ayahNumber}`} verse={verse} />) : <Card><p className="text-center text-stone-500">You have no bookmarked Quran verses.</p></Card>}
            </div>
        </div>
    );
};
export default LibraryView;