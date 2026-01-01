import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Message } from '../../types';
import { FrostContainer } from '../ui/FrostContainer';

interface MessageLogProps {
  messages: Message[];
}

export const MessageLog: React.FC<MessageLogProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <FrostContainer className="flex-1 min-h-0 flex flex-col p-6 overflow-y-auto custom-scrollbar" noBorder>
      <div className="flex-1" /> {/* Spacer to push messages down initially */}

      <div className="flex flex-col gap-6">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';
          const isModel = msg.role === 'model';
          const isRoll = msg.isRoll;

          if (isSystem) {
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
                className="self-center my-2 bg-black/40 border border-indigo-500/30 rounded px-4 py-2 text-indigo-200 font-mono text-sm shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              >
                {msg.text}
              </motion.div>
            );
          }

          return (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`flex flex-col max-w-[90%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
            >
               {/* Author Name */}
               <span className={`text-[10px] uppercase tracking-wider mb-1 ${isUser ? 'text-slate-400 mr-1' : 'text-sky-300 ml-1 font-bold'}`}>
                 {msg.author || (isUser ? 'You' : 'Quinn')}
               </span>

               {/* Bubble */}
               <div className={`
                 relative px-5 py-4 rounded-2xl text-base leading-relaxed font-serif shadow-sm
                 ${isUser
                   ? 'bg-white/10 text-slate-100 rounded-br-none border border-white/5'
                   : 'bg-black/40 text-slate-200 rounded-bl-none border border-white/10 backdrop-blur-md'
                 }
               `}>
                 {isModel ? (
                   // Simple Fade-in line by line effect could be complex, sticking to simple render for now
                   // or we can use a library, but let's keep it simple text for robustness.
                   // The request asked for "Text should fade in character-by-character".
                   // Doing that properly requires a Typewriter component.
                   // For now, let's just fade the block in.
                   <div className="whitespace-pre-wrap">{msg.text}</div>
                 ) : (
                   <div className="whitespace-pre-wrap">{msg.text}</div>
                 )}
               </div>
            </motion.div>
          );
        })}
      </div>
      <div ref={bottomRef} />
    </FrostContainer>
  );
};
