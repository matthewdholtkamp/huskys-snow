import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// In a real app, these would be high-res images.
// Using CSS gradients/patterns that match the theme for now.
const SCENES: Record<string, string> = {
  'default': 'bg-gradient-to-b from-slate-900 to-slate-800',
  'river': 'bg-gradient-to-br from-blue-900 via-slate-900 to-cyan-900',
  'forest': 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900 via-slate-900 to-black',
  'road': 'bg-gradient-to-b from-slate-800 via-slate-950 to-zinc-900',
  'coyote_camp': 'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-950 via-slate-900 to-black',
  'dreamland': 'bg-gradient-to-tr from-purple-900 via-slate-900 to-indigo-900',
  'cave': 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black',
  'snowfield': 'bg-gradient-to-b from-sky-200 via-white to-sky-100', // Blinding snow
};

interface BackgroundLayerProps {
  scene?: string; // e.g. 'cave', 'forest' - derived from last message context
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ scene = 'default' }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Keep a modest number of stable particles so the game stays smooth on phones.
  const snowflakes = useMemo(() => {
    return Array.from({ length: 28 }).map((_, idx) => {
      const size = Math.random() * 4 + 2; // 2px to 6px
      return {
        id: idx,
        left: `${Math.random() * 100}%`,
        size: `${size}px`,
        duration: `${Math.random() * 12 + 8}s`, // 8s to 20s
        delay: `${Math.random() * -20}s`, // start scattered
        opacity: Math.random() * 0.4 + 0.2, // 0.2 to 0.6
        blur: size > 4 ? '1px' : '0px', // slight depth blur for larger flakes
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
      <AnimatePresence mode='wait'>
        <motion.div
            key={scene}
            className={`absolute inset-0 ${SCENES[scene] || SCENES['default']}`}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
            animate={{
                opacity: 1,
                scale: 1.0,
                transition: { duration: prefersReducedMotion ? 0.5 : 2, ease: "easeOut" }
            }}
            exit={{ opacity: 0 }}
        >
             {/* Dynamic Particles or "Snow" overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_80%_85%,rgba(34,211,238,0.07),transparent_30%)] opacity-70" />

            {/* Ken Burns Effect Wrapper */}
            {!prefersReducedMotion && (
              <motion.div
                  className="absolute inset-0 opacity-20"
                  animate={{
                      scale: [1, 1.03, 1],
                      x: [0, 15, 0],
                  }}
                  transition={{
                      duration: 25,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "linear"
                  }}
              >
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 via-transparent to-black/30" />
              </motion.div>
            )}

            {/* Falling Snow overlay */}
            {!prefersReducedMotion && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {snowflakes.map((flake) => (
                  <div
                    key={flake.id}
                    className="absolute bg-white rounded-full animate-fall"
                    style={{
                      left: flake.left,
                      width: flake.size,
                      height: flake.size,
                      opacity: flake.opacity,
                      filter: `blur(${flake.blur})`,
                      animationDuration: flake.duration,
                      animationDelay: flake.delay,
                      top: '-10px',
                    }}
                  />
                ))}
              </div>
            )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
