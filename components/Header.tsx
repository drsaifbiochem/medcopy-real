import React from 'react';
import { Stethoscope, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-2 rounded-lg text-white">
              <Stethoscope size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                MedCopy <span className="text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full border border-teal-100 dark:border-teal-800">BETA</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Medical Intelligence Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-100 dark:border-slate-700">
                <Activity size={14} className="text-teal-500" />
                <span>RAG Context Enabled</span>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};