import React from 'react';
import { Stethoscope, Activity, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-2.5 rounded-xl text-white shadow-lg shadow-teal-500/30 group-hover:scale-105 transition-transform duration-300">
              <Stethoscope size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 flex items-center gap-2">
                MedCopy
                <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-0.5 rounded-full border border-cyan-100 dark:border-cyan-800 tracking-wider">
                  AI Studio
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide flex items-center gap-1">
                Medical Intelligence Engine <span className="text-slate-300 dark:text-slate-600">•</span> v2.6 (Persona AI)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Systems Nominal</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              <Activity size={14} />
              <span>RAG Active</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};