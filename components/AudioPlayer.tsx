import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ayah, Reciter } from '../types';

interface AudioPlayerProps {
    verses: Ayah[];
    onAyahChange: (ayahId: number | null) => void;
}

const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
);
const NextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
);
const PrevIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" /></svg>
);

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ verses, onAyahChange }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
    const [reciters, setReciters] = useState<Reciter[]>([]);
    const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isRepeating, setIsRepeating] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (verses.length > 0 && verses[0].reciters) {
            const allReciters = verses[0].reciters;
            setReciters(allReciters);
            if (allReciters.length > 0) {
                setSelectedReciter(allReciters[0]);
            }
        }
    }, [verses]);

    const playAyah = useCallback((index: number) => {
        if (!selectedReciter || index < 0 || index >= verses.length) {
            setIsPlaying(false);
            return;
        }

        const ayah = verses[index];
        const reciterUrl = ayah.reciters?.find(r => r.id === selectedReciter.id)?.url;
        if (!reciterUrl) {
            console.warn(`Reciter ${selectedReciter.name} not available for ayah ${ayah.id}`);
            if (index + 1 < verses.length) playAyah(index + 1);
            else setIsPlaying(false);
            return;
        }
        
        if (audioRef.current) {
            audioRef.current.pause();
        }
        
        const audio = new Audio(reciterUrl);
        audio.playbackRate = playbackSpeed;
        audioRef.current = audio;
        
        audio.play().catch(e => {
            console.error("Audio play failed:", e);
            setIsPlaying(false);
        });

        setIsPlaying(true);
        setCurrentAyahIndex(index);
        onAyahChange(ayah.id);

        audio.onended = () => {
            if (isRepeating) {
                audio.currentTime = 0;
                audio.play();
            } else if (index + 1 < verses.length) {
                playAyah(index + 1);
            } else {
                setIsPlaying(false);
                onAyahChange(null);
            }
        };

    }, [verses, selectedReciter, playbackSpeed, isRepeating, onAyahChange]);
    
    const handlePlayPause = () => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            onAyahChange(null);
        } else {
            playAyah(currentAyahIndex);
        }
    };
    
    const handleNext = () => {
        const nextIndex = currentAyahIndex + 1;
        if (nextIndex < verses.length) {
            playAyah(nextIndex);
        }
    };

    const handlePrev = () => {
        const prevIndex = currentAyahIndex - 1;
        if (prevIndex >= 0) {
            playAyah(prevIndex);
        }
    };
    
    useEffect(() => {
        return () => { // Cleanup on unmount
            if (audioRef.current) audioRef.current.pause();
            onAyahChange(null);
        }
    }, [onAyahChange]);

    if (verses.length === 0) return null;

    return (
        <div className="sticky bottom-0 left-0 right-0 z-20">
            <div className="bg-white/90 backdrop-blur-sm border-t-2 border-islamic-gold p-3 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] rounded-t-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center justify-center gap-2">
                         <button onClick={handlePrev} disabled={currentAyahIndex === 0} className="p-2 text-stone-700 hover:text-islamic-green-dark disabled:text-stone-300 transition-colors"><PrevIcon className="w-6 h-6"/></button>
                         <button onClick={handlePlayPause} className="p-3 bg-islamic-green text-white rounded-full shadow-md hover:bg-islamic-green-dark transition-transform transform hover:scale-110">
                            {isPlaying ? <PauseIcon className="w-7 h-7"/> : <PlayIcon className="w-7 h-7"/>}
                         </button>
                         <button onClick={handleNext} disabled={currentAyahIndex === verses.length - 1} className="p-2 text-stone-700 hover:text-islamic-green-dark disabled:text-stone-300 transition-colors"><NextIcon className="w-6 h-6"/></button>
                    </div>

                    <div className="flex-grow text-center md:text-left">
                        <p className="font-semibold text-stone-800 truncate">
                            {isPlaying ? `Playing Ayah ${verses[currentAyahIndex].id}` : 'Audio Player Paused'}
                        </p>
                        <p className="text-sm text-stone-500">{selectedReciter?.name || 'No Reciter Selected'}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedReciter?.id || ''}
                            onChange={e => setSelectedReciter(reciters.find(r => r.id === e.target.value) || null)}
                            className="text-sm p-1 bg-stone-100 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-islamic-green"
                            aria-label="Select Reciter"
                        >
                            {reciters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <select
                            value={playbackSpeed}
                            onChange={e => setPlaybackSpeed(Number(e.target.value))}
                            className="text-sm p-1 bg-stone-100 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-islamic-green"
                            aria-label="Playback Speed"
                        >
                            {[0.75, 1, 1.25, 1.5, 2].map(s => <option key={s} value={s}>{s}x</option>)}
                        </select>
                        <button onClick={() => setIsRepeating(!isRepeating)} className={`p-2 rounded-full ${isRepeating ? 'bg-islamic-green text-white' : 'text-stone-500'}`} aria-label="Repeat Ayah">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
