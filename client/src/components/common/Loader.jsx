import React from 'react';

export const Loader = ({ size = 'medium', label = 'Loading banking portal...' }) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className={`${sizeClasses[size] || sizeClasses.medium} border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent rounded-full animate-spin`} />
      {label && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
};
