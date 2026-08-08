import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Message } from '../../types';
import { FrostContainer } from '../ui/FrostContainer';
import { Typewriter } from '../effects/Typewriter';

interface MessageLogProps {
  messages: Message[];
}

// System messages emitted on [[SCENE]] changes look like: "🗺️ The scene shifts to: RIVER"
const SCENE_SHIFT_PREFIX = '🗺️';

const isSceneShift = (msg: Message) =>
  msg.role === 'system' && msg.text.startsWith(SCENE_SHIFT_PREFIX);

const sceneShiftLabel = (text: string): string => {
  const idx = text.indexOf(':');
  return idx !== -1 ? text.slice(idx + 1).trim() : text.replace(SCENE_SHIFT_PREFIX, '').trim();
};

// --- Storybook text rendering (presentation only) ---

// Mist speaks telepathically: violet, translucent, no quotation marks.
const MIST_NAME = /\bmist(?:yfeather)?\b/i;
const QUOTE_CHARS = /["“”]/g;

const isMistWhisperLine = (line: string) =>
  MIST_NAME.test(line) && QUOTE_CHARS.test(line);

/** Renders the storyteller's inline markdown (**bold** / *italics*); stray markers are hidden. */
const renderInline = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
  return parts
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={`${keyPrefix}-${i}`} className="font-bold text-frost-200">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</em>;
      }
      return <React.Fragment key={`${keyPrefix}-${i}`}>{part.replace(/\*/g, '')}</React.Fragment>;
    });
};

/**
 * Renders story text as book paragraphs. Lines are classified against the FULL
 * text so styling stays stable while the Typewriter streams `displayed`.
 */
const renderStory = (fullText: string, displayed: string): React.ReactNode => {
  const fullLines = fullText.split('\n');
  return displayed.split('\n').map((line, i) => {
    if (line.trim() === '') return null;
    const fullLine = fullLines[i] ?? line;
    if (isMistWhisperLine(fullLine)) {
      return (
        <p key={i} className="mb-3 last:mb-0 italic text-violet-300/80">
          {renderInline(line.replace(QUOTE_CHARS, ''), `l${i}`)}
        </p>
      );
    }
    return (
      <p key={i} className="mb-3 last:mb-0">
        {renderInline(line, `l${i}`)}
      </p>
    );
  });
};

/** Snowflake-and-paw chapter ornament shown on every scene change. */
const ChapterOrnament: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center gap-1.5 py-3 select-none">
    <div className="flex items-center gap-3 w-full max-w-xs mx-auto text-frost-300/70">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-frost-300/40" />
      <svg width="84" height="20" viewBox="0 0 84 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
        {/* left paw print */}
        <g fill="currentColor" opacity="0.65">
          <ellipse cx="10" cy="12.5" rx="2.6" ry="2.2" />
          <circle cx="6.3" cy="9" r="1.2" />
          <circle cx="10" cy="7.6" r="1.2" />
          <circle cx="13.7" cy="9" r="1.2" />
        </g>
        {/* central snowflake */}
        <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <line x1="42" y1="3" x2="42" y2="17" />
          <line x1="35.9" y1="6.5" x2="48.1" y2="13.5" />
          <line x1="35.9" y1="13.5" x2="48.1" y2="6.5" />
          <line x1="40.4" y1="4.6" x2="42" y2="6.2" />
          <line x1="43.6" y1="4.6" x2="42" y2="6.2" />
          <line x1="40.4" y1="15.4" x2="42" y2="13.8" />
          <line x1="43.6" y1="15.4" x2="42" y2="13.8" />
        </g>
        <circle cx="42" cy="10" r="1.6" fill="currentColor" />
        {/* right paw print */}
        <g fill="currentColor" opacity="0.65">
          <ellipse cx="74" cy="12.5" rx="2.6" ry="2.2" />
          <circle cx="70.3" cy="9" r="1.2" />
          <circle cx="74" cy="7.6" r="1.2" />
          <circle cx="77.7" cy="9" r="1.2" />
        </g>
      </svg>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-frost-300/40" />
    </div>
    {label && (
      <span className="text-[10px] font-serif uppercase tracking-[0.3em] text-frost-200/60">
        {label}
      </span>
    )}
  </div>
);

export const MessageLog: React.FC<MessageLogProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Drop caps open the story and the first narrative paragraph after each scene change.
  const dropCapIndexes = new Set<number>();
  let awaitingDropCap = true;
  messages.forEach((msg, idx) => {
    if (isSceneShift(msg)) awaitingDropCap = true;
    if (msg.role === 'model' && !msg.isRoll && awaitingDropCap) {
      dropCapIndexes.add(idx);
      awaitingDropCap = false;
    }
  });

  return (
    <FrostContainer
      className="book-page min-h-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/50 p-0 shadow-[0_18px_60px_rgba(2,8,23,0.3)]"
      contentClassName="h-full min-h-0"
      noBorder
    >
      <div ref={scrollRef} className="custom-scrollbar flex h-full min-h-0 flex-col overflow-y-auto p-5 md:px-10 md:py-8">
        <div className="min-h-4 flex-1" /> {/* Spacer to push messages down initially */}

        <div
          className="flex flex-col gap-5 md:gap-6"
          role="log"
          aria-live="polite"
        >
          {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';
          const isModel = msg.role === 'model';
          const isRoll = msg.isRoll;

          if (isSystem) {
             // Scene changes become a chapter ornament divider on the page.
             if (isSceneShift(msg)) {
               return (
                 <motion.div
                   key={msg.id || idx}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                 >
                   <ChapterOrnament label={sceneShiftLabel(msg.text)} />
                 </motion.div>
               );
             }
             return (
               <motion.div
                 key={msg.id || idx}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="text-center py-2"
               >
                 <span className="text-xs font-serif text-slate-400 uppercase tracking-widest px-3 py-1 border-y border-white/10">
                   {msg.text}
                 </span>
               </motion.div>
             );
          }

          if (isRoll) {
            return (
              <motion.div
                key={msg.id || idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="self-center my-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2 font-mono text-sm text-cyan-100"
              >
                {msg.text}
              </motion.div>
            );
          }

          // Player actions read as italic margin-note interjections beside the page.
          if (isUser) {
            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="self-end max-w-[75%] text-right"
              >
                <span className="block text-[10px] font-sans uppercase tracking-widest text-sky-300/70 mb-0.5 pr-3">
                  {msg.author || 'You'}
                </span>
                <p className="font-story italic text-[15px] leading-relaxed text-slate-300/90 border-r-2 border-frost-400/40 pr-3">
                  {msg.text}
                </p>
              </motion.div>
            );
          }

          const isLatest = idx === messages.length - 1;
          const hasDropCap = dropCapIndexes.has(idx);

          // Storyteller narrative renders as book paragraphs — no chat bubble.
          return (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <div
                className={`mx-auto w-full max-w-prose font-story text-lg leading-[1.7] text-slate-100/95 ${hasDropCap ? 'drop-cap' : ''}`}
              >
                {isModel && isLatest ? (
                  <Typewriter
                    text={msg.text}
                    render={(shown) => renderStory(msg.text, shown)}
                    onComplete={scrollToBottom}
                  />
                ) : (
                  renderStory(msg.text, msg.text)
                )}
              </div>
            </motion.div>
          );
          })}
        </div>
      </div>
    </FrostContainer>
  );
};
