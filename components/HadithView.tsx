
import React, { useState, useEffect } from 'react';
import { Hadith, HadithApiResponse, Chapter } from '../types';
import { searchHadiths, getChaptersForBook, getHadithsByChapter } from '../services/hadithApiService';
import { HADITH_BOOKS } from '../constants';
import { Card } from './common/Card';
import { IconButton, BookmarkIcon, BookmarkFilledIcon } from './common/IconButton';
import { useBookmarkedHadiths } from '../hooks/useBookmarkedHadiths';
import { SkeletonLoader } from './common/SkeletonLoader';

const HadithView: React.FC = () => {
    // Shared State
    const { bookmarkedHadiths, addBookmark, removeBookmark, isBookmarked } = useBookmarkedHadiths();
    const [activeTab, setActiveTab] = useState<'search' | 'books' | 'bookmarks'>('search');
    
    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [hadithNumber, setHadithNumber] = useState('');
    const [selectedBook, setSelectedBook] = useState('');
    const [searchResults, setSearchResults] = useState<HadithApiResponse | null>(null);
    const [searchIsLoading, setSearchIsLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Book View State
    const [bookViewSelectedBook, setBookViewSelectedBook] = useState<string>('sahih-bukhari');
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [chapterHadiths, setChapterHadiths] = useState<HadithApiResponse | null>(null);
    const [bookViewIsLoading, setBookViewIsLoading] = useState<'chapters' | 'hadiths' | false>(false);
    const [bookViewError, setBookViewError] = useState<string | null>(null);

    // Effect to fetch chapters when selected book changes in Books tab
    useEffect(() => {
        if (activeTab !== 'books') return;

        const fetchChapters = async () => {
            setBookViewIsLoading('chapters');
            setBookViewError(null);
            setChapters([]);
            setSelectedChapter(null);
            setChapterHadiths(null);
            try {
                const response = await getChaptersForBook(bookViewSelectedBook);
                setChapters(response.chapters);
            } catch (err: any) {
                setBookViewError(err.message);
            } finally {
                setBookViewIsLoading(false);
            }
        };
        fetchChapters();
    }, [bookViewSelectedBook, activeTab]);

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
        setSelectedChapter(chapter);
        setBookViewIsLoading('hadiths');
        setBookViewError(null);
        if (page === 1) setChapterHadiths(null);
        try {
            const response = await getHadithsByChapter(bookViewSelectedBook, chapter.chapterNumber, page);
            setChapterHadiths(response);
        } catch (err: any) {
            setBookViewError(err.message);
        } finally {
            setBookViewIsLoading(false);
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
        const bookmarked = isBookmarked(hadith.id);
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
                            <IconButton onClick={() => bookmarked ? removeBookmark(hadith.id) : addBookmark(hadith)} aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}>
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

    const HadithCardSkeleton: React.FC = () => (
        <Card className="mb-4">
            <div className="border-b border-stone-200 pb-3 mb-3">
                <div className="flex justify-between items-start">
                    <div className="flex-grow pr-4 space-y-2"><SkeletonLoader className="h-5 w-1/2" /><SkeletonLoader className="h-4 w-3/4" /></div>
                    <SkeletonLoader className="h-6 w-16 rounded-full" />
                </div>
            </div>
            <div className="space-y-3"><SkeletonLoader className="h-4 w-full" /><SkeletonLoader className="h-4 w-5/6" /><SkeletonLoader className="h-8 w-full mt-4" /></div>
        </Card>
    );
    
    const ChapterListSkeleton: React.FC = () => (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => <SkeletonLoader key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );

    const renderPagination = (data: HadithApiResponse, handler: (page: number) => void, isLoading: boolean) => (
        data.hadiths.last_page > 1 && (
            <div className="flex justify-between items-center mt-6">
                <button onClick={() => handler(data.hadiths.current_page - 1)} disabled={!data.hadiths.prev_page_url || isLoading} className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition disabled:opacity-50">Previous</button>
                <span className="text-sm text-stone-500">Page {data.hadiths.current_page} of {data.hadiths.last_page}</span>
                <button onClick={() => handler(data.hadiths.current_page + 1)} disabled={!data.hadiths.next_page_url || isLoading} className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition disabled:opacity-50">Next</button>
            </div>
        )
    );

    return (
        <div className="space-y-6 overflow-y-auto p-1 h-full">
            <Card>
                <div className="border-b border-stone-200 mb-4">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        {['search', 'books', 'bookmarks'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`capitalize whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab ? 'border-islamic-green text-islamic-green-dark' : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'}`}>
                                {tab} {tab === 'bookmarks' ? `(${bookmarkedHadiths.length})` : ''}
                            </button>
                        ))}
                    </nav>
                </div>
                {activeTab === 'search' && (
                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(1); }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="search-term" className="block text-sm font-medium text-stone-600 mb-2">Keyword (English):</label>
                                <input id="search-term" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="e.g., prayer, charity" className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition" />
                            </div>
                            <div>
                                <label htmlFor="hadith-number" className="block text-sm font-medium text-stone-600 mb-2">Number:</label>
                                <input id="hadith-number" type="text" value={hadithNumber} onChange={(e) => setHadithNumber(e.target.value)} placeholder="e.g., 1" className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="book-select" className="block text-sm font-medium text-stone-600 mb-2">Book:</label>
                            <select id="book-select" value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)} className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition">
                                <option value="">All Books</option>
                                {HADITH_BOOKS.map(book => <option key={book.slug} value={book.slug}>{book.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" disabled={searchIsLoading} className="w-full px-4 py-3 bg-islamic-green text-white font-semibold rounded-lg hover:bg-islamic-green-dark transition shadow-sm disabled:bg-opacity-50 flex items-center justify-center">Search</button>
                    </form>
                )}
            </Card>

            {searchError && activeTab === 'search' && <Card><p className="text-red-600 text-center">{searchError}</p></Card>}
            {bookViewError && activeTab === 'books' && <Card><p className="text-red-600 text-center">{bookViewError}</p></Card>}

            {activeTab === 'search' && (
                <>
                    {searchIsLoading && !searchResults && Array.from({length: 3}).map((_, i) => <HadithCardSkeleton key={i} />)}
                    {searchResults && searchResults.hadiths.data.length > 0 && (
                        <div>
                            {searchResults.hadiths.data.map(hadith => <HadithCard key={hadith.id} hadith={hadith} />)}
                            {renderPagination(searchResults, handleSearch, searchIsLoading)}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'books' && (
                <Card>
                    {!selectedChapter ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="books-book-select" className="block text-sm font-medium text-stone-600 mb-2">Select Collection:</label>
                                <select id="books-book-select" value={bookViewSelectedBook} onChange={(e) => setBookViewSelectedBook(e.target.value)} className="w-full p-3 bg-stone-50 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-islamic-green focus:outline-none transition">
                                    {HADITH_BOOKS.map(book => <option key={book.slug} value={book.slug}>{book.name}</option>)}
                                </select>
                            </div>
                            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                                {bookViewIsLoading === 'chapters' ? <ChapterListSkeleton /> : chapters.map(chapter => (
                                    <button key={chapter.id} onClick={() => handleSelectChapter(chapter)} className="w-full text-left p-3 rounded-lg transition-colors bg-stone-50 hover:bg-stone-100 border border-stone-200">
                                        <p className="font-semibold text-stone-800">Chapter {chapter.chapterNumber}: {chapter.chapterEnglish}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <button onClick={() => setSelectedChapter(null)} className="text-sm font-medium text-islamic-green-dark hover:underline mb-4">&larr; Back to Chapters</button>
                            <h3 className="text-lg font-bold text-islamic-green-dark mb-4">Chapter {selectedChapter.chapterNumber}: {selectedChapter.chapterEnglish}</h3>
                            {bookViewIsLoading === 'hadiths' && !chapterHadiths && Array.from({length: 3}).map((_, i) => <HadithCardSkeleton key={i} />)}
                            {chapterHadiths && chapterHadiths.hadiths.data.length > 0 && (
                                <div>
                                    {chapterHadiths.hadiths.data.map(hadith => <HadithCard key={hadith.id} hadith={hadith} />)}
                                    {renderPagination(chapterHadiths, (page) => handleSelectChapter(selectedChapter, page), bookViewIsLoading === 'hadiths')}
                                </div>
                            )}
                            {chapterHadiths && chapterHadiths.hadiths.data.length === 0 && <p className="text-center text-stone-500">No hadiths found in this chapter.</p>}
                        </div>
                    )}
                </Card>
            )}

            {activeTab === 'bookmarks' && (
                <div>
                    {bookmarkedHadiths.length > 0 ? (
                        bookmarkedHadiths.map(hadith => <HadithCard key={hadith.id} hadith={hadith} />)
                    ) : (
                        <Card><p className="text-center text-stone-500">You have no bookmarked Hadiths.</p></Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default HadithView;
