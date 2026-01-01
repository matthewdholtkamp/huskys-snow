import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface FrostContainerProps {
  children: React.ReactNode;
  className?: string;
  noBorder?: boolean;
}

export const FrostContainer: React.FC<FrostContainerProps> = ({
  children,
  className,
  noBorder = false
}) => {
  return (
    <div className={twMerge(
      clsx(
        "relative overflow-hidden backdrop-blur-xl bg-white/5",
        "shadow-lg shadow-black/20",
        !noBorder && "border border-white/10 rounded-xl",
        className
      )
    )}>
      {/* Subtle frost texture overlay could go here */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
