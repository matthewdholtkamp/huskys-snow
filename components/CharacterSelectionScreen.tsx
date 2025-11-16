import React, { useState } from 'react';
import Snowfall from './Snowfall';
import StatBar from './StatBar';
import { CHARACTERS } from '../constants';
import type { Character, Player } from '../types';
import { Sparkles, Shield, Zap, Brain, Users, Clipboard, LogIn } from './icons';

interface CharacterSelectionScreenProps {
  onSelectChar: (char: Character) => void;
  onLeaveGame: () => void;
  isLoading: boolean;
  error: string | null;
  gameId: string | null;
  playersInGame: Player[];
}

const CharacterSelectionScreen: React.FC<CharacterSelectionScreenProps> = ({
  onSelectChar,
  onLeaveGame,
  isLoading,
  error,
  gameId,
  playersInGame
}) => {
  const [copied, setCopied] = useState(false);
  const takenCharNames = playersInGame.map(p => p.charName);

  const handleCopy = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 overflow-y-auto">
      <Snowfall />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-cyan-100">Choose Your Pup</h2>
            <p className="text-slate-400 mt-2">The pack awaits your decision...</p>
        </div>

        {gameId && (
            <div className="max-w-2xl mx-auto bg-slate-950/50 border border-slate-800 rounded-2xl p-4 mb-6 text-center">
                <div className="mb-3">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Share Game ID</label>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <input type="text" readOnly value={gameId} className="bg-slate-800 text-center text-cyan-300 font-mono rounded-md px-2 py-1 select-all" />
                        <button onClick={handleCopy} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 hover:text-white transition-colors">
                            <Clipboard size={16} />
                        </button>
                    </div>
                    {copied && <p className="text-emerald-400 text-xs mt-2">Copied to clipboard!</p>}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800">
                    <h3 className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center justify-center gap-2 mb-2"><Users size={14} /> Players in Lobby ({playersInGame.length})</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {playersInGame.length > 0 ? playersInGame.map(p => (
                            <span key={p.userId} className="bg-slate-700 text-slate-200 text-sm font-bold px-3 py-1 rounded-full">{p.charName || 'Choosing...'}</span>
                        )) : (
                            <span className="text-slate-600 italic text-sm">You are the first one here!</span>
                        )}
                    </div>
                </div>
            </div>
        )}
         <button onClick={onLeaveGame} className="absolute top-0 left-0 m-2 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
            <LogIn size={20} className="rotate-180" />
            <span className="sr-only">Leave Game</span>
         </button>

        {error && <p className="text-red-400 mb-4 text-center bg-red-900/50 p-3 rounded-lg border border-red-700 max-w-md mx-auto">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {CHARACTERS.map(char => {
            const isTaken = takenCharNames.includes(char.name);
            return (
              <div
                key={char.id}
                onClick={() => !isLoading && !isTaken && onSelectChar(char)}
                className={`
                  group bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full
                  ${isTaken ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-400 cursor-pointer hover:shadow-2xl hover:shadow-cyan-500/20 transform hover:-translate-y-2'}
                `}
              >
                <div className={`h-40 ${char.color} relative flex items-center justify-center overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                  <char.icon size={80} className="text-white/90 transform group-hover:scale-110 transition-transform duration-500 drop-shadow-md" />
                  {isTaken && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold uppercase tracking-widest">Taken</div>}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold text-white mb-1">{char.name}</h3>
                  <p className="text-cyan-400 text-xs font-bold mb-4 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={10} /> {char.role}
                  </p>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed flex-1">{char.description}</p>

                  <div className="space-y-3 mt-auto bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <StatBar label="STR" value={char.stats.strength} icon={Shield} color="bg-rose-500" />
                    <StatBar label="AGI" value={char.stats.agility} icon={Zap} color="bg-amber-500" />
                    <StatBar label="INT" value={char.stats.smart} icon={Brain} color="bg-blue-500" />
                    <StatBar label="SPR" value={char.stats.spirit} icon={Sparkles} color="bg-violet-500" />
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Special Ability</span>
                    <span className="text-xs font-bold text-cyan-300 bg-cyan-900/30 px-2 py-1 rounded border border-cyan-500/30">{char.ability}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectionScreen;