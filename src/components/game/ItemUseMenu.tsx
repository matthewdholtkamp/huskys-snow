import React from 'react';
import { InventoryItem } from '../../types';
import { FrostContainer } from '../ui/FrostContainer';
import { X, ShieldAlert } from 'lucide-react';

interface ItemUseMenuProps {
  item: InventoryItem;
  onClose: () => void;
  onUse: () => void;
  isDowned?: boolean;
  isRollRequired?: boolean;
  isMyTurn?: boolean;
  isSpectator?: boolean;
}

export const ItemUseMenu: React.FC<ItemUseMenuProps> = ({
  item,
  onClose,
  onUse,
  isDowned = false,
  isRollRequired = false,
  isMyTurn = true,
  isSpectator = false,
}) => {
  const isDisabled = isDowned || !isMyTurn || isSpectator;
  let warningMessage = '';
  let isWarningAmber = false;

  if (isDowned) {
    warningMessage = "You are currently downed! You cannot use items until a packmate revives you.";
  } else if (isSpectator) {
    warningMessage = "You are spectating this game. Spectators cannot use items.";
  } else if (!isMyTurn) {
    warningMessage = "It is not your turn! You must wait for your turn to use items.";
  } else if (isRollRequired) {
    warningMessage = "Use this instead of rolling. Matching gear can turn the challenge into progress.";
    isWarningAmber = true;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <FrostContainer className="max-w-md w-full p-6 relative animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Item Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl p-3 bg-black/20 rounded-xl border border-white/10 flex items-center justify-center aspect-square select-none">
            {item.icon}
          </div>
          <div>
            <h3 className="font-serif text-lg text-white font-bold">{item.name}</h3>
            <span className="text-xs text-indigo-300 font-mono">
              {item.consumable === false ? 'Reusable' : `Quantity: ${item.quantity}`}
            </span>
          </div>
        </div>

        {/* Item Description */}
        <p className="text-sm text-slate-300 leading-relaxed mb-4 font-sans">
          {item.description}
        </p>

        {/* Item Effect Banner */}
        {item.effect && (
          <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-3 mb-6 flex items-center gap-2">
            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Effect:</span>
            <span className="text-emerald-300 text-sm italic">{item.effect}</span>
          </div>
        )}

        {/* Warning Banner */}
        {warningMessage && (
          <div className={`border rounded-lg p-3 mb-6 flex items-start gap-2 text-xs ${
            isWarningAmber 
              ? 'bg-amber-950/40 border-amber-500/20 text-amber-300' 
              : 'bg-rose-950/40 border-rose-500/20 text-rose-300'
          }`}>
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onUse();
              onClose();
            }}
            disabled={isDisabled}
            className="px-5 py-2 text-sm text-white font-serif bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700/50 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all font-semibold border border-indigo-500/30"
          >
            {item.consumable === false ? 'Use Gear' : 'Use Item'}
          </button>
        </div>
      </FrostContainer>
    </div>
  );
};
