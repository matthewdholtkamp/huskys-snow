import React from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

interface ActionBarProps {
  suggestions: string[];
  onAction: (action: string) => void;
  characterName: string;
  isThinking: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  suggestions,
  onAction,
  characterName,
  isThinking,
  disabled = false,
  placeholder,
}) => {
  if (isThinking) {
    return (
      <div className="flex min-h-16 w-full items-center justify-center gap-3 text-sm text-slate-400" role="status">
        <span>Quinn is shaping the next scene</span>
        <span className="flex" aria-hidden="true">
          {[0, 0.18, 0.36].map((delay) => (
            <motion.span
              key={delay}
              className="mx-0.5 h-1.5 w-1.5 rounded-full bg-cyan-200"
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay }}
            />
          ))}
        </span>
      </div>
    );
  }

  const actionsToShow = suggestions.length > 0 ? suggestions : [
    "Follow Mist's whisper.",
    'Check the riverbank for clues.',
    'Ask the pack what they noticed.',
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <div>
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Suggested moves</p>
        <div className="action-scroll flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          {actionsToShow.map((text, idx) => (
            <motion.button
              key={text}
              type="button"
              onClick={() => !disabled && onAction(text)}
              disabled={disabled}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              className={`min-h-10 shrink-0 whitespace-nowrap rounded-lg border px-3.5 py-2 text-left text-sm font-semibold transition ${
                disabled
                  ? 'cursor-not-allowed border-white/5 text-slate-600 opacity-50'
                  : 'border-white/10 bg-white/[0.035] text-slate-200 hover:border-cyan-300/35 hover:bg-cyan-300/[0.07] hover:text-white active:translate-y-px'
              }`}
            >
              {text}
            </motion.button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (disabled) return;
          const form = event.currentTarget;
          const formData = new FormData(form);
          const input = String(formData.get('customAction') || '');
          if (input.trim()) onAction(input.trim());
          form.reset();
        }}
        className="flex w-full items-stretch gap-2"
      >
        <label htmlFor="custom-action" className="sr-only">Describe what {characterName} does</label>
        <input
          id="custom-action"
          name="customAction"
          type="text"
          disabled={disabled}
          autoComplete="off"
          placeholder={placeholder || (disabled ? 'Wait for your turn to act…' : `What does ${characterName} do?`)}
          className={`min-h-11 min-w-0 flex-1 rounded-xl border px-4 py-2.5 text-sm transition ${
            disabled
              ? 'cursor-not-allowed border-white/5 bg-slate-950/20 text-slate-600 placeholder:text-slate-600'
              : 'border-white/12 bg-slate-950/55 text-white placeholder:text-slate-500 focus:border-cyan-300/60'
          }`}
        />
        <button
          type="submit"
          disabled={disabled}
          aria-label="Send action"
          className="grid min-h-11 w-12 shrink-0 place-items-center rounded-xl bg-cyan-300 text-slate-950 transition hover:bg-cyan-200 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
};
