import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ScreenShakeProps {
  children: React.ReactNode;
  trigger: boolean;
  intensity?: 'soft' | 'hard';
}

export const ScreenShake: React.FC<ScreenShakeProps> = ({ children, trigger, intensity = 'soft' }) => {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  const shakeVariants = {
    idle: { x: 0, y: 0 },
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      y: [0, 5, -5, 5, -5, 0],
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      variants={shakeVariants}
      animate={isShaking ? 'shake' : 'idle'}
      className="w-full h-full"
    >
      {/* Red Overlay for Damage Flash */}
      {isShaking && (
        <div className="fixed inset-0 bg-red-500/10 pointer-events-none z-50 animate-pulse" />
      )}
      {children}
    </motion.div>
  );
};
