import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// In a real app, these would be high-res images.
// Using CSS gradients/patterns that match the theme for now.
const SCENES: Record<string, string> = {
  'default': 'bg-gradient-to-b from-slate-900 to-slate-800',
  'cave': 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black',
  'forest': 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900 via-slate-900 to-black',
  'snowfield': 'bg-gradient-to-b from-sky-200 via-white to-sky-100', // Blinding snow
  'river': 'bg-gradient-to-br from-blue-900 via-slate-900 to-cyan-900',
};

interface BackgroundLayerProps {
  scene?: string; // e.g. 'cave', 'forest' - derived from last message context
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ scene = 'default' }) => {
  const [bgClass, setBgClass] = useState(SCENES['default']);

  // Simple keyword matching to switch backgrounds based on text context could be implemented in parent
  // For now, we will stick to a default or prop-passed scene.

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
      <AnimatePresence mode='wait'>
        <motion.div
            key={scene}
            className={`absolute inset-0 ${SCENES[scene] || SCENES['default']}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
                opacity: 1,
                scale: 1.0,
                transition: { duration: 2, ease: "easeOut" }
            }}
            exit={{ opacity: 0 }}
        >
             {/* Dynamic Particles or "Snow" overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-overlay"></div>

            {/* Ken Burns Effect Wrapper if we had an image */}
            <motion.div
                className="absolute inset-0 opacity-30"
                animate={{
                    scale: [1, 1.05, 1],
                    x: [0, 20, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear"
                }}
            >
                {/* Optional: Abstract shapes or clouds */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 via-transparent to-black/40" />
            </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
