import React from 'react';
import Snowfall from './Snowfall';
import { Snowflake, Mountain, Users } from './icons';

interface IntroScreenProps {
  onEnterLobby: () => void;
  isAuthReady: boolean;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onEnterLobby, isAuthReady }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <Snowfall />
      <div className="z-10 max-w-3xl w-full bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl text-center">
        <div className="mb-4 flex justify-center">
          <Snowflake size={64} className="text-cyan-300 animate-spin-slow" />
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-400 to-blue-500 mb-4 drop-shadow-lg">
          HUSKY'S SNOW
        </h1>
        <p className="text-xl text-slate-300 mb-8 tracking-widest uppercase font-light flex items-center justify-center gap-2">
          <Mountain size={20} /> A Multiplayer Adventure <Mountain size={20} />
        </p>
        
        <button 
           onClick={onEnterLobby}
           disabled={!isAuthReady}
           className="w-full py-5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg transform transition hover:scale-[1.02] text-xl flex items-center justify-center gap-3 ring-2 ring-white/10 disabled:opacity-50 disabled:cursor-wait"
         >
           {isAuthReady ? <><Users size={24} /> Enter Lobby</> : 'Connecting...'}
         </button>
      </div>
    </div>
  );
};

export default IntroScreen;