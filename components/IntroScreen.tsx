import React from 'react';
import Snowfall from './Snowfall';
import { Snowflake, Mountain, Users, BookOpen, Dice5 } from './icons';

interface IntroScreenProps {
  onEnterLobby: () => void;
  onContinueAdventure: () => void;
  hasSavedGame: boolean;
  isAuthReady: boolean;
}

const IntroScreen: React.FC<IntroScreenProps> = ({
  onEnterLobby,
  onContinueAdventure,
  hasSavedGame,
  isAuthReady,
}) => {
  const heroImage = `${import.meta.env.BASE_URL}assets/moonshine-river-hero.jpg`;

  return (
    <main className="relative isolate min-h-[100svh] overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <div
        className="absolute inset-0 bg-cover bg-[68%_center] md:bg-center"
        style={{ backgroundImage: `url("${heroImage}")` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,11,22,0.98)_0%,rgba(4,11,22,0.86)_38%,rgba(4,11,22,0.25)_72%,rgba(4,11,22,0.08)_100%)]"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" aria-hidden="true" />
      <Snowfall />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl items-end px-5 py-8 sm:px-8 md:items-center md:py-16 lg:px-12">
        <section className="w-full max-w-xl pb-2 md:pb-0" aria-labelledby="game-title">
          <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-cyan-200/80">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-cyan-200/20 bg-cyan-200/10 shadow-[0_0_28px_rgba(34,211,238,0.14)]">
              <Snowflake size={17} aria-hidden="true" />
            </span>
            Moonshine River Pack
          </div>

          <h1 id="game-title" className="font-serif text-5xl font-bold leading-[0.94] tracking-[-0.045em] text-white drop-shadow-2xl sm:text-6xl md:text-7xl lg:text-8xl">
            Husky's<br /><span className="text-cyan-200">Snow</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-200/85 sm:text-lg">
            Gather your pack, follow Mist's whisper, and decide the fate of the frozen river together.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {hasSavedGame && (
              <button
                onClick={onContinueAdventure}
                disabled={!isAuthReady}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 py-3.5 text-base font-extrabold text-slate-950 shadow-[0_12px_38px_rgba(34,211,238,0.22)] transition hover:bg-cyan-200 active:translate-y-px disabled:cursor-wait disabled:opacity-50"
              >
                {isAuthReady ? <><BookOpen size={20} aria-hidden="true" /> Continue adventure</> : 'Connecting…'}
              </button>
            )}

            <button
              onClick={onEnterLobby}
              disabled={!isAuthReady}
              className={`${hasSavedGame ? 'border border-white/20 bg-white/10 text-white hover:bg-white/15' : 'bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-[0_12px_38px_rgba(34,211,238,0.22)]'} inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-extrabold backdrop-blur-sm transition active:translate-y-px disabled:cursor-wait disabled:opacity-50`}
            >
              {isAuthReady ? <><Users size={20} aria-hidden="true" /> {hasSavedGame ? 'New or join a game' : 'Begin the adventure'}</> : 'Connecting…'}
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300/70">
            <span className="inline-flex items-center gap-1.5"><Users size={14} aria-hidden="true" /> 1–6 pups</span>
            <span className="inline-flex items-center gap-1.5"><Dice5 size={14} aria-hidden="true" /> D20 choices</span>
            <span className="inline-flex items-center gap-1.5"><Mountain size={14} aria-hidden="true" /> Shared story</span>
          </div>

          <p className="sr-only" aria-live="polite">
            {isAuthReady ? 'Game connection ready.' : 'Connecting to the game service.'}
          </p>
        </section>
      </div>
    </main>
  );
};

export default IntroScreen;
