import React, { useState } from 'react';
import Snowfall from './Snowfall';
import { CHARACTERS, ITEMS_REGISTRY, STARTER_ITEM_BY_CHARACTER } from '../src/constants';
import type { Character, Player } from '../src/types';
import { Sparkles, Users, Clipboard, LogIn, RotateCcw, Snowflake } from './icons';

interface CharacterSelectionScreenProps {
  onSelectChar: (char: Character) => void;
  onLeaveGame: () => void;
  isLoading: boolean;
  error: string | null;
  gameId: string | null;
  playersInGame: Player[];
  modeNotice?: string | null;
}

interface QuizQuestion {
  text: string;
  options: {
    text: string;
    points: { charName: string; weight: number }[];
  }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    text: "What is your ideal pack role during a trek through the snow?",
    options: [
      {
        text: "🌲 Running ahead to scout the trail and climbing trees for high ground.",
        points: [{ charName: "Spruce", weight: 2 }, { charName: "Storm", weight: 1 }]
      },
      {
        text: "🛡️ Standing guard to protect the team and check for danger.",
        points: [{ charName: "Glacier", weight: 2 }, { charName: "Oak", weight: 1 }]
      },
      {
        text: "🧠 Checking the map, calculating resources, and correcting anyone who gets lost.",
        points: [{ charName: "Shiver", weight: 2 }]
      },
      {
        text: "💖 Gathering warm berries, soothing scratches, and keeping spirits high.",
        points: [{ charName: "Flurry", weight: 2 }]
      }
    ]
  },
  {
    text: "Pick a cool elemental power you would love to control!",
    options: [
      {
        text: "❄️ Ice Shields & Frost Magic",
        points: [{ charName: "Shiver", weight: 1.5 }, { charName: "Glacier", weight: 1.5 }]
      },
      {
        text: "⚡ Crackling Thunder & Red Lightning",
        points: [{ charName: "Storm", weight: 2 }]
      },
      {
        text: "🔥 Cozy Fire & Solar Embers",
        points: [{ charName: "Spruce", weight: 2 }]
      },
      {
        text: "🍃 Whispering Wind & Healing Plants",
        points: [{ charName: "Flurry", weight: 1.5 }, { charName: "Oak", weight: 1.5 }]
      }
    ]
  },
  {
    text: "How do you solve a locked stone door blocking your path?",
    options: [
      {
        text: "🤸 Scout for a high window to sneak through or pick the lock.",
        points: [{ charName: "Spruce", weight: 2 }]
      },
      {
        text: "💥 Charge and smash it down with a heavy tail-swipe!",
        points: [{ charName: "Storm", weight: 1.5 }, { charName: "Glacier", weight: 1.5 }]
      },
      {
        text: "🧩 Read the runes and solve the logic puzzle on the lock.",
        points: [{ charName: "Shiver", weight: 2 }]
      },
      {
        text: "✨ Call upon the forest spirits or seek a key hidden in the moss.",
        points: [{ charName: "Flurry", weight: 1.5 }, { charName: "Oak", weight: 1.5 }]
      }
    ]
  },
  {
    text: "What is your absolute favorite thing to do on a snow day?",
    options: [
      {
        text: "🏂 Climbing high snowdrifts and telling funny winter stories.",
        points: [{ charName: "Spruce", weight: 2 }]
      },
      {
        text: "⚔️ Starting an epic, fast-paced snowball battle!",
        points: [{ charName: "Storm", weight: 2 }]
      },
      {
        text: "🏰 Building a sturdy, warm snow castle fort.",
        points: [{ charName: "Glacier", weight: 1.5 }, { charName: "Shiver", weight: 1.5 }]
      },
      {
        text: "🐾 Spotting hidden animal tracks and helping a chilly bird.",
        points: [{ charName: "Oak", weight: 1.5 }, { charName: "Flurry", weight: 1.5 }]
      }
    ]
  }
];

const CharacterSelectionScreen: React.FC<CharacterSelectionScreenProps> = ({
  onSelectChar,
  onLeaveGame,
  isLoading,
  error,
  gameId,
  playersInGame,
  modeNotice
}) => {
  const [copied, setCopied] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [recommendedCharName, setRecommendedCharName] = useState<string | null>(null);

  const takenCharNames = playersInGame.map(p => p.charName);

  const handleCopy = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAnswerSelect = (option: typeof QUIZ_QUESTIONS[number]['options'][number]) => {
    const updatedScores = { ...quizScores };
    option.points.forEach(p => {
      updatedScores[p.charName] = (updatedScores[p.charName] || 0) + p.weight;
    });
    setQuizScores(updatedScores);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      let highestScore = -1;
      let recommended = '';
      CHARACTERS.forEach(char => {
        const score = updatedScores[char.name] || 0;
        if (score > highestScore) {
          highestScore = score;
          recommended = char.name;
        }
      });
      setRecommendedCharName(recommended);
    }
  };

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-slate-950 px-4 py-5 text-slate-100 sm:px-6 md:px-8 md:py-8">
      <Snowfall />
      <div className="expedition-grid fixed inset-0 opacity-50" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-7 border-b border-white/10 pb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300/75">
                <Snowflake size={14} aria-hidden="true" /> Pack roster
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">Choose your pup</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">Every pup brings a different strength to the trail. Pick the one whose instincts match yours.</p>
            </div>
            {!quizActive && (
              <button
                onClick={() => {
                  setQuizActive(true);
                  setCurrentQuestion(0);
                  setQuizScores({});
                  setRecommendedCharName(null);
                }}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2.5 text-sm font-bold text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/15 active:translate-y-px"
              >
                <Sparkles size={16} aria-hidden="true" /> Find my pup
              </button>
            )}
          </div>
        </header>

        <button
          onClick={onLeaveGame}
          className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <LogIn size={18} className="rotate-180" aria-hidden="true" /> Leave game
        </button>

        {gameId && (
          <section aria-label="Game invitation" className="mb-7 grid gap-4 border-y border-white/10 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="shrink-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Invite your pack</span>
                <span className="mt-1 block text-sm text-slate-300">Share this private game code</span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <input aria-label="Game code" type="text" readOnly value={gameId} className="min-w-0 flex-1 select-all rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center font-mono text-sm text-cyan-200 sm:w-64" />
                <button onClick={handleCopy} aria-label="Copy game code" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
                  <Clipboard size={16} aria-hidden="true" />
                </button>
              </div>
              {copied && <p role="status" className="text-xs font-bold text-emerald-300">Copied</p>}
            </div>

            <div className="flex items-center gap-3 md:justify-end">
              <Users size={17} className="text-slate-500" aria-hidden="true" />
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">In the lobby</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {playersInGame.length > 0 ? playersInGame.map((player) => (
                    <span key={player.userId} className="text-sm font-bold text-slate-200">{player.charName || 'Choosing…'}</span>
                  )) : (
                    <span className="text-sm text-slate-400">You are first to arrive</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {error && <p className="text-red-400 mb-4 text-center bg-red-900/50 p-3 rounded-lg border border-red-700 max-w-md mx-auto">{error}</p>}
        {modeNotice && <p className="text-amber-200 mb-4 text-center bg-amber-950/60 p-3 rounded-lg border border-amber-700/60 max-w-2xl mx-auto">{modeNotice}</p>}

        {quizActive ? (
          <div className="max-w-2xl mx-auto bg-slate-950/70 backdrop-blur-md border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={12} /> Pup Match Quiz
              </span>
              <button
                onClick={() => {
                  setQuizActive(false);
                  setRecommendedCharName(null);
                }}
                className="text-xs text-slate-500 hover:text-white underline transition-colors"
              >
                Cancel Quiz
              </button>
            </div>

            {recommendedCharName === null ? (
              <div>
                <div className="w-full bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${(currentQuestion / QUIZ_QUESTIONS.length) * 100}%` }}
                  />
                </div>

                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 font-mono">
                  Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
                </div>
                
                <h3 className="text-2xl font-serif font-bold text-white mb-6 leading-snug">
                  {QUIZ_QUESTIONS[currentQuestion].text}
                </h3>

                <div className="space-y-4">
                  {QUIZ_QUESTIONS[currentQuestion].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(option)}
                      className="w-full text-left px-5 py-4 bg-slate-900/60 border border-slate-800 hover:border-indigo-500 hover:bg-slate-800/40 rounded-2xl text-slate-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group"
                    >
                      <span className="text-sm md:text-base font-medium pr-4">{option.text}</span>
                      <span className="w-6 h-6 rounded-full border border-slate-700 group-hover:border-indigo-500 flex items-center justify-center shrink-0 text-indigo-400 transition-colors text-xs">
                        ➔
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex p-3.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-4 animate-bounce">
                  <Sparkles className="w-10 h-10 text-indigo-400" />
                </div>
                
                <h3 className="text-xs text-indigo-300 uppercase tracking-widest font-extrabold mb-1 font-mono">
                  The Spirits Have Spoken!
                </h3>
                <h4 className="text-3xl font-serif font-extrabold text-white mb-4">
                  Your Perfect Match is {recommendedCharName}!
                </h4>

                {(() => {
                  const recommendedChar = CHARACTERS.find(c => c.name === recommendedCharName);
                  if (!recommendedChar) return null;
                  const isTaken = takenCharNames.includes(recommendedCharName);
                  
                  return (
                    <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden p-6 mb-6 text-left shadow-lg relative">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-16 h-16 rounded-xl ${recommendedChar.color} flex items-center justify-center text-white`}>
                          <recommendedChar.icon size={36} />
                        </div>
                        <div>
                          <h5 className="text-xl font-bold text-white leading-none">{recommendedChar.name}</h5>
                          <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">{recommendedChar.role}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-300 leading-relaxed mb-4">
                        {recommendedChar.description}
                      </p>

                      <div className="text-xs text-slate-500 flex justify-between border-t border-slate-800 pt-3">
                        <span>Special Ability</span>
                        <span className="font-bold text-cyan-300">{recommendedChar.ability}</span>
                      </div>

                      {isTaken && (
                        <div className="mt-4 p-3 bg-red-950/40 border border-red-500/20 rounded-lg text-rose-400 text-xs flex gap-2">
                          <span>⚠️</span>
                          <span><strong>{recommendedCharName}</strong> is taken in this lobby by another player. You can select another character from the list below!</span>
                        </div>
                      )}

                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => {
                            setQuizActive(false);
                          }}
                          className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-700"
                        >
                          View All Pups
                        </button>
                        <button
                          disabled={isTaken || isLoading}
                          onClick={() => onSelectChar(recommendedChar)}
                          className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-lg font-serif transition-all flex items-center justify-center gap-2 ${
                            isTaken 
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5 shadow-none'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95'
                          }`}
                        >
                          Choose {recommendedCharName}
                        </button>
                      </div>
                    </div>
                  );
                })()}
                
                <button
                  onClick={() => {
                    setCurrentQuestion(0);
                    setQuizScores({});
                    setRecommendedCharName(null);
                  }}
                  className="text-xs text-slate-500 hover:text-white underline transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <RotateCcw size={12} /> Retake Quiz
                </button>
              </div>
            )}
          </div>
        ) : (
          <section aria-label="Available pups" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {CHARACTERS.map(char => {
              const isTaken = takenCharNames.includes(char.name);
              const isRecommended = recommendedCharName === char.name;
              const starterItem = ITEMS_REGISTRY[STARTER_ITEM_BY_CHARACTER[char.id]];
              return (
                <button
                  type="button"
                  key={char.id}
                  onClick={() => !isLoading && !isTaken && onSelectChar(char)}
                  disabled={isLoading || isTaken}
                  aria-label={isTaken ? `${char.name} is already taken` : `Choose ${char.name}, ${char.role}`}
                  className={`
                    group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-slate-900/70 text-left backdrop-blur-md transition duration-200
                    ${isTaken ? 'cursor-not-allowed border-white/5 opacity-45' : 'cursor-pointer border-white/10 hover:-translate-y-1 hover:border-cyan-300/45 hover:bg-slate-900/90 hover:shadow-[0_18px_50px_rgba(2,132,199,0.13)]'}
                    ${isRecommended && !isTaken ? 'border-cyan-300/60 ring-2 ring-cyan-300/30' : ''}
                  `}
                >
                  {isRecommended && !isTaken && (
                    <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-cyan-200/25 bg-slate-950/75 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-100 shadow-md">
                      <Sparkles size={10} aria-hidden="true" /> Quiz match
                    </div>
                  )}
                  <div className={`relative flex h-28 items-center justify-between overflow-hidden px-5 ${char.color}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-white/10" aria-hidden="true" />
                    <div className="relative">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Trail role</span>
                      <p className="mt-1 max-w-[13rem] text-sm font-extrabold uppercase tracking-wide text-white">{char.role.replace(/^The /, '')}</p>
                    </div>
                    <char.icon size={58} className="relative text-white/90 drop-shadow-md transition-transform duration-300 group-hover:scale-105" aria-hidden="true" />
                    {isTaken && <div className="absolute inset-0 grid place-items-center bg-slate-950/75 text-sm font-extrabold uppercase tracking-[0.24em] text-white">Already chosen</div>}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-serif text-2xl font-bold text-white">{char.name}</h2>
                      <span className="text-xs font-bold text-cyan-200 opacity-0 transition-opacity group-hover:opacity-100">Choose →</span>
                    </div>
                    <p className="mt-2 line-clamp-3 min-h-[3.9rem] text-sm leading-relaxed text-slate-300">{char.description}</p>

                    <dl className="mt-5 grid grid-cols-4 gap-2 border-y border-white/8 py-3">
                      {[
                        ['STR', char.stats.strength],
                        ['AGI', char.stats.agility],
                        ['INT', char.stats.smart],
                        ['SPI', char.stats.spirit],
                      ].map(([label, value]) => (
                        <div key={label} className="text-center">
                          <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
                          <dd className="mt-0.5 font-mono text-sm font-bold text-slate-100">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Spirit surge</span>
                      <span className="text-right text-xs font-bold text-cyan-200">{char.ability}</span>
                    </div>
                    {starterItem && (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Starts with</span>
                        <span className="text-right text-xs font-semibold text-slate-200">{starterItem.icon} {starterItem.name}</span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </section>
        )}
      </div>
    </main>
  );
};

export default CharacterSelectionScreen;
