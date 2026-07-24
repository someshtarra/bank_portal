import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 text-center">
      <div className="space-y-6 max-w-md">
        <div className="inline-flex p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-3xl">
          <Landmark className="w-12 h-12" />
        </div>
        <h1 className="text-6xl font-extrabold text-slate-900 dark:text-white">404</h1>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Page Not Found</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The banking page or transaction URL you requested does not exist or has been moved.
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
