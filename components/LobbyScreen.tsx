
import React, { useState } from 'react';
import Snowfall from './Snowfall';
import { PlusSquare, LogIn } from './icons';

interface LobbyScreenProps {
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
  isLoading: boolean;
  error: string | null;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ onCreateGame, onJoinGame, isLoading, error }) => {
  const [joinGameId, setJoinGameId] = useState('');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <Snowfall />
      <div className="z-10 max-w-md w-full bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-6 text-cyan-100">Game Lobby</h2>
        {error && <p className="text-red-400 mb-4 text-center bg-red-900/50 p-3 rounded-lg border border-red-700">{error}</p>}
        
        <div className="mb-6">
          <button
            onClick={onCreateGame}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-lg transform transition hover:scale-[1.02] text-lg flex items-center justify-center gap-3"
          >
            <PlusSquare size={20} /> Create New Game
          </button>
        </div>

        <div className="relative flex items-center justify-center mb-6">
          <span className="h-px bg-slate-700 flex-1"></span>
          <span className="mx-4 text-slate-500 uppercase text-xs font-bold">Or</span>
          <span className="h-px bg-slate-700 flex-1"></span>
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-300 mb-2">Join Existing Game</label>
           <div className="flex gap-2">
              <input
                type="text"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                placeholder="Paste Game ID..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
              />
              <button
                onClick={() => onJoinGame(joinGameId)}
                disabled={isLoading}
                className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
                title="Join Game"
              >
                <LogIn size={24} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
