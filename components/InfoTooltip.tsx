import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
    text: string;
    position?: 'left' | 'right' | 'center';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, position = 'right' }) => {
    const alignClass =
        position === 'left'
            ? 'right-0 translate-x-0'
            : position === 'right'
                ? 'left-0 translate-x-0'
                : 'left-1/2 -translate-x-1/2';

    return (
        <div className="group relative inline-flex items-center ml-1.5 align-middle cursor-help">
            <Info size={14} className="text-slate-400 hover:text-teal-500 dark:text-slate-500 dark:hover:text-teal-400 transition-colors" />

            {/* Tooltip Content — positioned to the right by default to avoid left-edge clipping */}
            <div
                className={`
                    absolute bottom-full ${alignClass} mb-2
                    w-56 p-2.5
                    bg-slate-900 dark:bg-slate-700
                    text-white text-xs leading-relaxed
                    rounded-lg shadow-xl shadow-black/30
                    opacity-0 invisible
                    group-hover:opacity-100 group-hover:visible
                    transition-all duration-150
                    z-[200]
                    pointer-events-none
                `}
            >
                {text}
                {/* Arrow */}
                <div className={`absolute top-full ${position === 'right' ? 'left-3' : position === 'left' ? 'right-3' : 'left-1/2 -translate-x-1/2'} -mt-px border-4 border-transparent border-t-slate-900 dark:border-t-slate-700`} />
            </div>
        </div>
    );
};
