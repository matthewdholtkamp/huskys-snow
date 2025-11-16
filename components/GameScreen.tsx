import React from 'react';
import Snowfall from './Snowfall';
import type { Message, Character, Player } from '../types';
// FIX: Import the CHARACTERS constant to resolve the undefined error.
import { CHARACTERS } from '../constants';
import { 
  User, 
  LogIn, 
  Dice5, 
  Send, 
  Feather, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Users,
  Clipboard
} from './icons';

interface GameScreenProps {
  messages: Message[];
  selectedChar: Character | null;
  suggestions: string[];
  isThinking: boolean;
  onSendMessage: (text: string) => void;
  onRoll: () => void;
  onLeaveGame: () => void;
  onRetry: () => void;
  gameId: string | null;
  players: Player[];
  playerRole: 'host' | 'player' | 'spectator';
}

const GameScreen: React.FC<GameScreenProps> = ({
  messages,
  selectedChar,
  suggestions,
  isThinking,
  onSendMessage,
  onRoll,
  onLeaveGame,
  onRetry,
  gameId,
  players,
  playerRole,
}) => {
  const [inputText, setInputText] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || isThinking) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleCopy = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputText(suggestion);
  };
  
  const canAct = playerRole !== 'spectator' && selectedChar;
  const isErrorState = messages[messages.length - 1]?.role === 'error';
  
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-cyan-500/30">
      <Snowfall />
      
      <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 md:px-6 z-20 shadow-lg">
        <div className="flex items-center gap-3">
           <div className={`w-10 h-10 rounded-full ${selectedChar?.color || 'bg-slate-700'} flex items-center justify-center text-white shadow-lg ring-2 ring-slate-800`}>
             {selectedChar ? <selectedChar.icon size={20} /> : <User size={20} />}
           </div>
           <div>
             <h1 className="font-bold text-lg leading-tight text-white">{selectedChar?.name || 'Spectator'}</h1>
             <p className="text-xs text-cyan-400 uppercase tracking-wide">{selectedChar?.role || 'Observing'}</p>
           </div>
        </div>
        
        <div className="hidden md:flex items-center gap-4 bg-slate-950/50 border border-slate-800 px-3 py-1.5 rounded-full">
            <div className="flex -space-x-2">
                {players.map(p => {
                    const char = CHARACTERS.find(c => c.name === p.charName);
                    return (
                        <div key={p.userId} className={`w-6 h-6 rounded-full ${char?.color || 'bg-gray-500'} flex items-center justify-center text-white ring-2 ring-slate-900`} title={p.charName}>
                            {char && <char.icon size={12} />}
                        </div>
                    );
                })}
            </div>
             <span className="text-xs font-mono text-slate-500">{gameId}</span>
             <button onClick={handleCopy} className="text-slate-500 hover:text-white transition-colors">
                <Clipboard size={14}/>
             </button>
             {copied && <span className="text-emerald-400 text-xs">Copied!</span>}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={onLeaveGame} 
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            title="Leave Game"
          >
            <LogIn size={18} className="rotate-180" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth relative z-10 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            <div className={`max-w-[90%] md:max-w-[75%] lg:max-w-[60%] p-5 rounded-2xl shadow-lg leading-relaxed text-base ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-tr-none border border-indigo-500/30' : msg.role === 'system' ? 'bg-slate-800/80 border border-slate-700 text-yellow-200 text-center w-full max-w-2xl mx-auto italic text-sm' : msg.role === 'error' ? 'bg-red-900/50 border border-red-700 text-red-200' : 'bg-slate-800/95 text-slate-200 border border-slate-700 rounded-tl-none shadow-xl'} ${msg.isRoll ? 'font-mono text-yellow-300 border-yellow-600/50 border bg-slate-900/90' : ''}`}>
              {msg.role === 'user' && msg.author && (<div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10 text-xs font-bold text-white uppercase tracking-wider"><User size={12} /> {msg.author}</div>)}
              {msg.role === 'model' && (<div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50 text-xs font-bold text-cyan-400 uppercase tracking-wider"><Feather size={12} /> Quinn</div>)}
              {msg.role === 'error' && (<div className="flex items-center gap-2 mb-2 text-xs font-bold text-red-400 uppercase tracking-wider"><AlertTriangle size={12} /> Error</div>)}
              <div className="whitespace-pre-wrap">{msg.text}</div>
              {msg.role === 'error' && playerRole === 'host' && (
                <button onClick={onRetry} className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-800/50 hover:bg-red-700/50 rounded-lg text-sm font-bold text-white transition-colors border border-red-500/30"><RotateCcw size={14} /> Retry Last Action</button>
              )}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700 flex items-center gap-3 shadow-lg">
                <span className="text-cyan-400 text-sm italic">Quinn is thinking...</span>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-slate-900 border-t border-slate-800 p-4 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        {canAct ? (
          <>
            {suggestions.length > 0 && !isThinking && !isErrorState && (
              <div className="max-w-4xl mx-auto mb-3 flex flex-wrap gap-2 justify-center animate-fade-in-up">
                {suggestions.map((suggestion, index) => (
                  <button key={index} onClick={() => handleSelectSuggestion(suggestion)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 rounded-full text-sm text-cyan-200 transition-colors">
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div className="max-w-4xl mx-auto flex gap-3">
              <button onClick={onRoll} disabled={isThinking || isErrorState} className="p-3 bg-slate-800 text-yellow-500 rounded-xl border border-slate-700 hover:bg-slate-700 hover:border-yellow-500 hover:text-yellow-400 transition-all shadow-md group relative disabled:opacity-50 disabled:cursor-not-allowed" title="Roll D20"><div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Roll D20</div><Dice5 size={24} className="group-hover:rotate-180 transition-transform duration-500" /></button>
              <input type="text" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600 disabled:opacity-50" placeholder="What do you want to do?" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} disabled={isThinking || isErrorState} />
              <button onClick={handleSend} disabled={isThinking || !inputText.trim() || isErrorState} className="p-3 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 active:scale-95"><Send size={24} /></button>
            </div>
            <div className="text-center mt-3 text-xs text-slate-600 flex items-center justify-center gap-2"><Sparkles size={10} /> {playerRole === 'host' ? "You are the Host. The story moves at your command." : "You are a player in this story."}</div>
          </>
        ) : (
          <div className="text-center text-slate-400">{selectedChar ? "You are observing the adventure." : "Your adventure has ended."}</div>
        )}
      </div>
    </div>
  );
};

export default GameScreen;