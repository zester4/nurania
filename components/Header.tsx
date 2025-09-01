import React from 'react';
import { View } from '../types';
import { useAppContext } from '../contexts/AppContext';

const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Header: React.FC = () => {
  const { currentView, setCurrentView } = useAppContext();

  const NavButton: React.FC<{ view: View; label: string }> = ({ view, label }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setCurrentView(view)}
        className={`px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm font-semibold transition-colors duration-300 rounded-md ${
          isActive
            ? 'bg-islamic-green text-white shadow-sm'
            : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-800'
        }`}
      >
        {label}
      </button>
    );
  };
  
  const IconButton: React.FC<{ view: View; children: React.ReactNode; 'aria-label': string }> = ({ view, children, ...props }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setCurrentView(view)}
        className={`p-2 md:p-2.5 transition-colors duration-300 rounded-full ${
          isActive
            ? 'bg-islamic-green text-white'
            : 'text-stone-500 hover:bg-stone-200/70 hover:text-stone-700'
        }`}
        {...props}
      >
        {children}
      </button>
    );
  };

  return (
    <header className="flex-shrink-0 flex justify-between items-center pt-4 md:pt-6 pb-2">
      <button onClick={() => setCurrentView('home')} className="text-left group flex-shrink-0 mr-2">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-islamic-green-dark group-hover:text-islamic-green transition-colors">
          Nurania
        </h1>
        <p className="text-stone-500 text-xs md:text-sm -mt-1">The AI Quran Tutor</p>
      </button>
      
      <div className="flex items-center space-x-1 md:space-x-2">
        <nav className="p-1 md:p-1.5 bg-stone-100/60 rounded-lg flex items-center space-x-0.5 md:space-x-1 border border-stone-200/60">
            <NavButton view="read" label="Read" />
            <NavButton view="tajweed" label="Practice" />
            <NavButton view="learning" label="Learning" />
            <NavButton view="library" label="Library" />
        </nav>
        <div className="border-l border-stone-300 h-6 mx-1 hidden sm:block"></div>
        <div className="flex items-center space-x-0.5 sm:space-x-1">
            <IconButton view="prayer" aria-label="Prayer Times">
                <ClockIcon className="w-5 h-5 md:w-6 md:h-6" />
            </IconButton>
            <IconButton view="settings" aria-label="Settings">
                <SettingsIcon className="w-5 h-5 md:w-6 md:h-6" />
            </IconButton>
        </div>
      </div>
    </header>
  );
};

export default Header;