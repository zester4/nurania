import React from 'react';
import Header from './components/Header';
import StudyView from './components/StudyView';
import TajweedView from './components/TajweedView';
import LibraryView from './components/LibraryView';
import HomeView from './components/HomeView';
import PrayerTimesView from './components/PrayerTimesView';
import SettingsView from './components/SettingsView';
import NotificationManager from './components/NotificationManager';
import ReadView from './components/ReadView';
import SearchView from './components/SearchView';
import LearningView from './components/LearningView';
import { useAppContext } from './contexts/AppContext';

const App: React.FC = () => {
  const { currentView, practiceVerse, gotoVerse, gotoHadith, gotoLearningPath } = useAppContext();
  const [internalPracticeVerse, setInternalPracticeVerse] = React.useState(practiceVerse);
  const [internalGotoVerse, setInternalGotoVerse] = React.useState(gotoVerse);
  const [internalGotoHadith, setInternalGotoHadith] = React.useState(gotoHadith);
  const [internalGotoLearningPath, setInternalGotoLearningPath] = React.useState(gotoLearningPath);
  
  React.useEffect(() => {
    setInternalPracticeVerse(practiceVerse);
  }, [practiceVerse]);

  React.useEffect(() => {
    setInternalGotoVerse(gotoVerse);
  }, [gotoVerse]);
  
  React.useEffect(() => {
    setInternalGotoHadith(gotoHadith);
  }, [gotoHadith]);
  
  React.useEffect(() => {
    setInternalGotoLearningPath(gotoLearningPath);
  }, [gotoLearningPath]);


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
          {currentView === 'read' && (
            <ReadView
              initialVerse={internalGotoVerse}
              onViewMounted={() => setInternalGotoVerse(null)}
            />
          )}
          {currentView === 'search' && <SearchView />}
          {currentView === 'learning' && (
            <LearningView
              initialTopic={internalGotoLearningPath}
              onViewMounted={() => setInternalGotoLearningPath(null)}
            />
          )}
          {currentView === 'library' && (
            <LibraryView 
              initialHadith={internalGotoHadith}
              onViewMounted={() => setInternalGotoHadith(null)}
            />
          )}
          {currentView === 'prayer' && <PrayerTimesView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default App;