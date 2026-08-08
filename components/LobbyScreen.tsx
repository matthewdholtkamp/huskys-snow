import React, { useState } from 'react';
import Snowfall from './Snowfall';
import { PlusSquare, LogIn, Users, KeyRound, Snowflake } from './icons';

interface LobbyScreenProps {
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
  isLoading: boolean;
  error: string | null;
  modeNotice?: string | null;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ onCreateGame, onJoinGame, isLoading, error, modeNotice }) => {
  const [joinGameId, setJoinGameId] = useState('');

  return (
    <main className="relative isolate min-h-[100svh] overflow-hidden bg-slate-950 px-5 py-8 text-slate-100 font-sans sm:px-8 lg:px-12">
      <Snowfall />
      <div className="expedition-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_25%,rgba(34,211,238,0.11),transparent_34%),radial-gradient(circle_at_20%_85%,rgba(59,130,246,0.08),transparent_38%)]" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(380px,470px)] lg:gap-20">
        <section aria-labelledby="lobby-title" className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.26em] text-cyan-300/80">
            <Snowflake size={15} aria-hidden="true" /> Pack assembly
          </div>
          <h1 id="lobby-title" className="max-w-xl font-serif text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Choose how your pack gathers.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Start a fresh trail as host, or enter a game code from another player to join their expedition.
          </p>

          <dl className="mt-9 hidden max-w-xl gap-5 border-t border-white/10 pt-6 sm:grid sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Host</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-400">Creates the game, guides Quinn's storyteller, and shares the code.</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Packmate</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-400">Chooses an available pup and takes turns in the shared story.</dd>
            </div>
          </dl>
        </section>

        <section aria-label="Create or join a game" className="border-t border-white/10 pt-7 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
          {error && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-950/45 p-3 text-sm text-rose-200">{error}</p>}
          {modeNotice && <p className="mb-5 rounded-xl border border-amber-400/25 bg-amber-950/35 p-3 text-sm text-amber-100">{modeNotice}</p>}

          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Start here</span>
            <h2 className="mt-2 font-serif text-2xl font-bold text-white">Lead a new expedition</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">You will receive a private code to invite the rest of your pack.</p>
            <button
              onClick={onCreateGame}
              disabled={isLoading}
              className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3.5 text-base font-extrabold text-slate-950 shadow-[0_12px_36px_rgba(34,211,238,0.16)] transition hover:bg-cyan-200 active:translate-y-px disabled:cursor-wait disabled:opacity-50"
            >
              <PlusSquare size={20} aria-hidden="true" /> {isLoading ? 'Creating game…' : 'Create new game'}
            </button>
          </div>

          <div className="my-8 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-600">or join</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={(event) => { event.preventDefault(); if (joinGameId.trim()) onJoinGame(joinGameId.trim()); }}>
            <label htmlFor="join-game-code" className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <KeyRound size={16} className="text-cyan-300" aria-hidden="true" /> Game code
            </label>
            <p id="join-game-help" className="mt-1 text-xs leading-relaxed text-slate-500">Paste the code exactly as your host shared it.</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="join-game-code"
                type="text"
                value={joinGameId}
                onChange={(event) => setJoinGameId(event.target.value)}
                aria-describedby="join-game-help"
                autoComplete="off"
                spellCheck={false}
                placeholder="Paste game code"
                className="min-h-[52px] min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.045] px-4 py-3 font-mono text-sm text-white placeholder:text-slate-600 focus:border-cyan-300"
              />
              <button
                type="submit"
                disabled={!joinGameId.trim() || isLoading}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-bold text-white transition hover:border-cyan-300/50 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <LogIn size={19} aria-hidden="true" /> Join game
              </button>
            </div>
          </form>

          <div className="mt-8 flex items-start gap-3 border-t border-white/10 pt-5 text-xs leading-relaxed text-slate-500">
            <Users size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
            <p>Each player chooses a different pup. The host can begin alone and friends can join later.</p>
          </div>
          <p className="sr-only" aria-live="polite">{isLoading ? 'Working on your game request.' : ''}</p>
        </section>
      </div>
    </main>
  );
};

export default LobbyScreen;
