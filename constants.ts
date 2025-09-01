import { HadithBook, LearningPathTopic } from './types';

export const HADITH_BOOKS: HadithBook[] = [
    { name: 'Sahih Bukhari', slug: 'sahih-bukhari' },
    { name: 'Sahih Muslim', slug: 'sahih-muslim' },
    { name: 'Jami\' Al-Tirmidhi', slug: 'al-tirmidhi' },
    { name: 'Sunan Abu Dawood', slug: 'abu-dawood' },
    { name: 'Sunan Ibn-e-Majah', slug: 'ibn-e-majah' },
    { name: 'Sunan An-Nasa`i', slug: 'sunan-nasai' },
    { name: 'Mishkat Al-Masabih', slug: 'mishkat' },
    { name: 'Musnad Ahmad', slug: 'musnad-ahmad' },
    { name: 'Al-Silsila Sahiha', slug: 'al-silsila-sahiha' },
];

export const LEARNING_PATH_TOPICS: LearningPathTopic[] = [
    {
        id: 'salah',
        title: 'Understanding Salah',
        description: 'Explore the significance, rules, and inner dimensions of the daily prayers.',
        icon: '🤲'
    },
    {
        id: 'prophets',
        title: 'Lives of the Prophets',
        description: 'Learn from the stories and struggles of the major prophets in the Quran.',
        icon: '📜'
    },
    {
        id: 'patience',
        title: 'Themes of Patience',
        description: 'A study on Sabr (patience) and its importance as highlighted in the Quran and Sunnah.',
        icon: '💖'
    },
    {
        id: 'ramadan',
        title: 'Preparing for Ramadan',
        description: 'A guided plan to spiritually prepare for the blessed month of Ramadan.',
        icon: '🌙'
    }
];