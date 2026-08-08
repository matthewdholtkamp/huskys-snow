import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Heart } from 'lucide-react';

interface ObjectiveTrackerProps {
  chapterTitle: string;
  objectiveText: string;
  packHeart?: number;
}

export const ObjectiveTracker: React.FC<ObjectiveTrackerProps> = ({
  chapterTitle,
  objectiveText,
  packHeart,
}) => {
  return (
    <section className="w-full rounded-xl border border-white/10 bg-slate-950/55 px-3.5 py-3 shadow-lg backdrop-blur-md" aria-labelledby="current-quest-title">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
          <Compass className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-cyan-300/75">Current quest</span>
          <AnimatePresence mode="wait">
            <motion.div
              key={chapterTitle}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22 }}
            >
              <h2 id="current-quest-title" className="mt-0.5 truncate font-serif text-sm font-bold text-white">{chapterTitle}</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{objectiveText}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {packHeart !== undefined && (
          <div className="hidden shrink-0 items-center gap-2 border-l border-white/10 pl-3 sm:flex" aria-label={`Pack Heart ${packHeart} out of 100`}>
            <Heart className="h-4 w-4 fill-rose-400/20 text-rose-300" aria-hidden="true" />
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Pack heart</span>
              <span className="font-mono text-xs font-bold text-white">{packHeart}/100</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
