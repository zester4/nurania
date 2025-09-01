import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-cream/80 backdrop-blur-sm border border-stone-200/80 rounded-xl shadow-lg p-6 ${className}`}>
      {children}
    </div>
  );
};