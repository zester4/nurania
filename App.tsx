
import React from 'react';
import Header from './components/Header';
import StudyView from './components/StudyView';
import TajweedView from './components/TajweedView';
import HadithView from './components/HadithView';
import HomeView from './components/HomeView';
import PrayerTimesView from './components/PrayerTimesView';
import SettingsView from './components/SettingsView';
import NotificationManager from './components/NotificationManager';
import ReadView from './components/ReadView';
import { useAppContext } from './contexts/AppContext';

const App: React.FC = () => {
  const { currentView, practiceVerse } = useAppContext();
  const [internalPracticeVerse, setInternalPracticeVerse] = React.useState(practiceVerse);
  
  React.useEffect(() => {
    setInternalPracticeVerse(practiceVerse);
  }, [practiceVerse]);

  return (
    <div className="bg-cream min-h-screen text-stone-800 font-quicksand islamic-pattern">
      <NotificationManager />
      <div className="container mx-auto p-2 md:p-4 max-w-4xl h-screen flex flex-col">
        <Header />
        <main className="flex-grow mt-4 overflow-hidden">
          {currentView === 'home' && <HomeView />}
          {currentView === 'study' && <StudyView />}
          {currentView === 'tajweed' && (
            <TajweedView
              initialVerse={internalPracticeVerse}
              onPracticeMounted={() => setInternalPracticeVerse(null)}
            />
          )}
          {currentView === 'read' && <ReadView />}
          {currentView === 'hadith' && <HadithView />}
          {currentView === 'prayer' && <PrayerTimesView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default App;
