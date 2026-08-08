import React from 'react';
import { Player } from '../../types';
import { FrostContainer } from '../ui/FrostContainer';
import { Heart, ShieldAlert } from 'lucide-react';
import { CHARACTERS } from '../../constants';

interface PartyStatusProps {
  players: Player[];
  localPlayerCharName?: string;
}

export const PartyStatus: React.FC<PartyStatusProps> = ({
  players,
  localPlayerCharName,
}) => {
  return (
    <FrostContainer className="w-full shrink-0 p-3">
      <h3 className="text-xs font-serif text-slate-300 uppercase tracking-widest mb-3 border-b border-white/5 pb-1 flex items-center justify-between">
        <span>Pack Status</span>
        <span className="text-[10px] text-indigo-300 font-mono font-normal">{players.length} Active</span>
      </h3>
      
      <div className="flex flex-col gap-2.5">
        {players.map((p) => {
          const isLocal = p.charName === localPlayerCharName;
          const charDef = CHARACTERS.find((c) => c.name === p.charName);
          const hp = p.hp ?? 100;
          const maxHp = p.maxHp ?? 100;
          const hpPercentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));
          const isDowned = hp === 0;

          // Determine health bar color based on percentage
          let healthBarColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
          if (isDowned) {
            healthBarColor = 'bg-rose-600 animate-pulse';
          } else if (hpPercentage <= 30) {
            healthBarColor = 'bg-gradient-to-r from-rose-500 to-orange-400';
          } else if (hpPercentage <= 60) {
            healthBarColor = 'bg-gradient-to-r from-amber-500 to-yellow-400';
          }

          return (
            <div
              key={p.userId + '-' + p.charName}
              className={`p-2 rounded border transition-all ${
                isLocal
                  ? 'bg-white/5 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.05)]'
                  : 'bg-black/20 border-white/5'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-serif text-sm text-slate-200 truncate font-bold">
                    {p.charName}
                  </span>
                  {isLocal && (
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 rounded font-sans font-semibold shrink-0 uppercase tracking-wider scale-90">
                      You
                    </span>
                  )}
                  {charDef && (
                    <span className="text-[10px] text-slate-400 truncate hidden md:inline">
                      • {charDef.role}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
                  {isDowned ? (
                    <span className="text-rose-400 font-bold flex items-center gap-0.5 animate-pulse uppercase tracking-wider text-[9px]">
                      <ShieldAlert className="w-3 h-3 animate-bounce" /> Downed
                    </span>
                  ) : (
                    <>
                      <Heart className="w-3 h-3 text-rose-400 fill-rose-500/30" />
                      <span>{hp}/{maxHp}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Health Bar Wrapper */}
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${healthBarColor}`}
                  style={{ width: `${hpPercentage}%` }}
                />
              </div>

              {/* Small status line */}
              <div className="flex justify-between items-center mt-1 text-[9px] text-slate-500 font-mono">
                <span>{p.rank || 'Pup'}</span>
                <span>{p.xp ?? 0} XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </FrostContainer>
  );
};
