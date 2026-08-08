import React from 'react';
import { ABILITIES } from '../../game/magic';
import { Sparkles } from 'lucide-react';

interface AbilityBarProps {
  charId: string; // 'shiver', 'oak', 'glacier', 'flurry'
  cooldownChapter?: string;
  currentChapterId: string;
  onUseAbility: () => void;
  disabled?: boolean;
}

export const AbilityBar: React.FC<AbilityBarProps> = ({
  charId,
  cooldownChapter,
  currentChapterId,
  onUseAbility,
  disabled = false,
}) => {
  const ability = ABILITIES[charId];

  if (!ability) return null;

  const isOnCooldown = cooldownChapter === currentChapterId;

  return (
    <div className="flex w-full select-none flex-col gap-2 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500">
            Spirit Surge
          </span>
        </div>
        
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
          isOnCooldown 
            ? 'bg-slate-800 text-slate-500' 
            : 'bg-cyan-300/10 text-cyan-200 border border-cyan-300/20'
        }`}>
          {isOnCooldown ? 'ON COOLDOWN' : 'READY TO CAST'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white tracking-wide truncate">
            {ability.name} <span className="text-[10px] text-slate-500 font-normal">({ability.element})</span>
          </h4>
          <p className="mt-0.5 hidden text-[10px] leading-normal text-slate-300 sm:block">
            {ability.description}
          </p>
        </div>

        <button
          onClick={onUseAbility}
          disabled={disabled || isOnCooldown}
          className={`shrink-0 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            isOnCooldown || disabled
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
              : 'bg-cyan-300 hover:bg-cyan-200 text-slate-950 shadow-md shadow-cyan-500/10 active:translate-y-px'
          }`}
        >
          Cast Surge
        </button>
      </div>
    </div>
  );
};
