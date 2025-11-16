
import React from 'react';

const Snowfall: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute text-white opacity-20 animate-fall"
          style={{
            left: `${Math.random() * 100}vw`,
            top: `-20px`,
            animationDuration: `${Math.random() * 5 + 5}s`,
            animationDelay: `${Math.random() * 5}s`,
            fontSize: `${Math.random() * 20 + 10}px`
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};

export default Snowfall;
