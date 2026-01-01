import React from 'react';
import { Character, Badge } from '../../types';
import { FrostContainer } from '../ui/FrostContainer';
import { BADGES_REGISTRY } from '../../constants';
import { Shield, Star } from 'lucide-react';

interface CharacterSheetProps {
  character: Character;
  earnedBadges?: Badge[];
  health?: number; // Simplified for now, could be max 100
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character,
  earnedBadges = [],
  health = 100
}) => {

  // Combine starter badges with earned ones
  const allBadges = [
    ...(character.visuals.badgeSlots.small ? [character.visuals.badgeSlots.small] : []),
    ...(character.visuals.badgeSlots.medium ? [character.visuals.badgeSlots.medium] : []),
    ...(character.visuals.badgeSlots.large ? [character.visuals.badgeSlots.large] : []),
    ...earnedBadges
  ];

  return (
    <FrostContainer className="p-4 w-full h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <div className={`p-2 rounded-lg ${character.color} bg-opacity-20 backdrop-blur-md border border-white/20`}>
          <character.icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-serif text-white tracking-wide">{character.name}</h2>
          <p className="text-xs text-slate-300 font-light uppercase tracking-wider">{character.role}</p>
        </div>
      </div>

      {/* Visual Harness / Badges */}
      <div className="flex-1 min-h-[120px] bg-black/20 rounded-lg p-3 relative overflow-hidden group">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 text-center">Harness: {character.visuals.harnessColor}</p>

        {/* Badge Grid */}
        <div className="flex flex-wrap gap-2 justify-center">
          {allBadges.length > 0 ? allBadges.map((badge, idx) => (
             <div key={idx} className="group/badge relative">
               <div className={`
                 flex items-center justify-center rounded-full border border-white/20 bg-white/5 shadow-[0_0_10px_rgba(255,255,255,0.1)]
                 ${badge.type === 'small' ? 'w-8 h-8 text-xs' : badge.type === 'medium' ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'}
               `}>
                 {badge.icon || <Star className="w-3 h-3" />}
               </div>
               {/* Tooltip */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-xs text-white rounded opacity-0 group-hover/badge:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
                 {badge.name}
               </div>
             </div>
          )) : (
            <p className="text-xs text-slate-500 italic mt-4">No badges yet...</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-sm font-sans">
        <div className="flex justify-between px-2 py-1 bg-white/5 rounded">
            <span className="text-slate-400">STR</span>
            <span className="font-bold">{character.stats.strength}</span>
        </div>
        <div className="flex justify-between px-2 py-1 bg-white/5 rounded">
            <span className="text-slate-400">AGI</span>
            <span className="font-bold">{character.stats.agility}</span>
        </div>
        <div className="flex justify-between px-2 py-1 bg-white/5 rounded">
            <span className="text-slate-400">INT</span>
            <span className="font-bold">{character.stats.smart}</span>
        </div>
        <div className="flex justify-between px-2 py-1 bg-white/5 rounded">
            <span className="text-slate-400">SPI</span>
            <span className="font-bold">{character.stats.spirit}</span>
        </div>
      </div>
    </FrostContainer>
  );
};
