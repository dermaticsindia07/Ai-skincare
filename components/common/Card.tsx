
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-brand-surface rounded-2xl shadow-lifted border border-slate-200/60 p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
};

export default Card;