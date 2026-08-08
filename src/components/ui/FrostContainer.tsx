import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface FrostContainerProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  noBorder?: boolean;
}

export const FrostContainer: React.FC<FrostContainerProps> = ({
  children,
  className,
  contentClassName,
  noBorder = false
}) => {
  return (
    <div className={twMerge(
      clsx(
        "relative overflow-hidden bg-slate-950/45 backdrop-blur-xl",
        "shadow-lg shadow-black/15",
        !noBorder && "rounded-xl border border-white/10",
        className
      )
    )}>
      {/* Subtle frost texture overlay could go here */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.045] to-transparent" />
      <div className={twMerge(clsx("relative z-10", contentClassName))}>
        {children}
      </div>
    </div>
  );
};
