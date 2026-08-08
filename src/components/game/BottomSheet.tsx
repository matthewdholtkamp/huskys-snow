import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-xs md:hidden"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ 
              y: 0,
              transition: { type: 'spring', damping: 25, stiffness: 220 }
            }}
            exit={{ 
              y: '100%',
              transition: { duration: 0.2 }
            }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden max-h-[85vh] flex flex-col rounded-t-3xl border-t border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Grab Handle */}
            <div className="w-full flex justify-center py-3 cursor-pointer" onClick={onClose}>
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-6 pb-2 border-b border-white/5">
              <h3 className="font-serif text-base text-slate-100 font-bold uppercase tracking-wider">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6 max-h-[calc(85vh-70px)] pb-12">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
