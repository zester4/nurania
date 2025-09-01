import React from 'react';
import { Card } from './common/Card';
import { IconButton, BookmarkFilledIcon } from './common/IconButton';
import { useBookmarkedVerses } from '../hooks/useBookmarkedVerses';
import { useAppContext } from '../contexts/AppContext';
import { BookmarkedVerse } from '../types';

const BookmarksView: React.FC = () => {
    const { bookmarkedVerses, removeBookmark } = useBookmarkedVerses();
    const { handleGotoVerse } = useAppContext();

    const BookmarkCard: React.FC<{ verse: BookmarkedVerse }> = ({ verse }) => {
        return (
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
                        <IconButton onClick={() => removeBookmark(verse.surahNumber, verse.ayahNumber)} aria-label="Remove bookmark">
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
    };

    return (
        <div className="space-y-6 overflow-y-auto p-1 h-full">
            <Card>
                <h2 className="text-xl font-semibold text-islamic-green-dark">Bookmarked Verses</h2>
                <p className="text-stone-600">Quickly access your saved verses from the Quran.</p>
            </Card>

            {bookmarkedVerses.length > 0 ? (
                bookmarkedVerses.map(verse => 
                    <BookmarkCard 
                        key={`${verse.surahNumber}-${verse.ayahNumber}`} 
                        verse={verse} 
                    />
                )
            ) : (
                <Card><p className="text-center text-stone-500">You have no bookmarked verses. Tap the bookmark icon next to any verse in the Quran reader to save it here.</p></Card>
            )}
        </div>
    );
};

export default BookmarksView;
