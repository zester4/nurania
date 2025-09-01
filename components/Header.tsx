
import React from 'react';
import { View } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface HeaderProps {}

const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);


const Header: React.FC<HeaderProps> = () => {
  const { currentView, setCurrentView } = useAppContext();

  const NavButton: React.FC<{ view: View; label: string }> = ({ view, label }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setCurrentView(view)}
        className={`px-3 py-2 text-sm md:text-base font-medium transition-colors duration-300 rounded-md ${
          isActive
            ? 'bg-islamic-green text-white shadow-sm'
            : 'text-stone-600 hover:bg-stone-200 hover:text-stone-800'
        }`}
      >
        {label}
      </button>
    );
  };
  
  const IconButton: React.FC<{ view: View; children: React.ReactNode }> = ({ view, children }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setCurrentView(view)}
        className={`p-2 transition-colors duration-300 rounded-full ${
          isActive
            ? 'bg-islamic-green text-white'
            : 'text-stone-500 hover:bg-stone-200 hover:text-stone-700'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 pt-4 md:pt-8 pb-4">
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-islamic-green-dark">
          Nurania
        </h1>
        <p className="text-stone-500 text-sm">The AI Quran Tutor</p>
      </div>
      <nav className="p-1.5 bg-stone-100/80 rounded-lg flex flex-wrap justify-center items-center space-x-1 border border-stone-200/80">
        <NavButton view="home" label="Home" />
        <NavButton view="read" label="Quran" />
        <NavButton view="tajweed" label="Tajweed Practice" />
        <NavButton view="study" label="Study Companion" />
        <NavButton view="hadith" label="Hadith" />
        <NavButton view="prayer" label="Prayer Times" />
        <div className="border-l border-stone-300 h-6 mx-1"></div>
        <IconButton view="settings">
            <SettingsIcon className="w-5 h-5" />
        </IconButton>
      </nav>
    </header>
  );
};

export default Header;
