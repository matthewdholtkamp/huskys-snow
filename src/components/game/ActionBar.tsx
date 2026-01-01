import React from 'react';
import { motion } from 'framer-motion';

interface ActionBarProps {
  suggestions: string[];
  onAction: (action: string) => void;
  characterName: string;
  isThinking: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  suggestions,
  onAction,
  characterName,
  isThinking
}) => {

  if (isThinking) {
    return (
      <div className="w-full h-20 flex items-center justify-center">
         <motion.div
           className="w-2 h-2 bg-white rounded-full mx-1"
           animate={{ opacity: [0.3, 1, 0.3] }}
           transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
         />
         <motion.div
           className="w-2 h-2 bg-white rounded-full mx-1"
           animate={{ opacity: [0.3, 1, 0.3] }}
           transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
         />
         <motion.div
           className="w-2 h-2 bg-white rounded-full mx-1"
           animate={{ opacity: [0.3, 1, 0.3] }}
           transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
         />
      </div>
    );
  }

  // If no AI suggestions, provide fallback context actions based on character role
  // (In a real scenario, we might want consistent buttons + dynamic ones, but for now dynamic is primary)
  const actionsToShow = suggestions.length > 0 ? suggestions : [
    "Look around carefully.",
    "Check my inventory.",
    "Sniff the air for danger."
  ];

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 justify-center">
        {actionsToShow.map((text, idx) => (
          <motion.button
            key={idx}
            onClick={() => onAction(text)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="
              px-4 py-3 bg-slate-900/40 hover:bg-white/10
              border border-white/20 hover:border-white/40
              backdrop-blur-md rounded-lg
              text-sm text-slate-200 font-medium
              shadow-[0_4px_14px_0_rgba(0,0,0,0.2)]
              transition-all active:scale-95
              flex-grow md:flex-grow-0
            "
          >
            {text}
          </motion.button>
        ))}
      </div>

      {/* Custom Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = (e.target as any).customAction.value;
          if(input.trim()) onAction(input);
          (e.target as any).reset();
        }}
        className="w-full mt-2"
      >
        <input
          name="customAction"
          type="text"
          placeholder={`What does ${characterName} do?`}
          className="w-full bg-black/30 border border-white/10 rounded px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors"
        />
      </form>
    </div>
  );
};
