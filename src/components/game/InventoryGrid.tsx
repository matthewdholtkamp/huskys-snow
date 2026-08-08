import React from 'react';
import { InventoryItem } from '../../types';
import { FrostContainer } from '../ui/FrostContainer';

interface InventoryGridProps {
  items: InventoryItem[];
  onItemSelect?: (item: InventoryItem) => void;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({ items, onItemSelect }) => {
  // Create a grid of fixed size (e.g., 9 slots)
  const slots = Array(9).fill(null).map((_, i) => items[i] || null);

  return (
    <FrostContainer className="w-full shrink-0 p-3">
      <h3 className="text-xs font-serif text-slate-300 uppercase tracking-widest mb-3 border-b border-white/5 pb-1">
        Pack Inventory
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((item, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => item && onItemSelect && onItemSelect(item)}
            disabled={!item}
            aria-label={item ? `${item.name}, quantity ${item.quantity}` : `Empty inventory slot ${idx + 1}`}
            className="group relative flex aspect-square items-center justify-center rounded border border-white/5 bg-black/20 transition-colors enabled:cursor-pointer enabled:hover:border-cyan-300/20 enabled:hover:bg-white/5 disabled:cursor-default"
          >
            {item ? (
              <>
                <span className="text-2xl filter drop-shadow-lg">{item.icon}</span>
                {item.quantity > 1 && (
                  <span className="absolute bottom-0 right-0 text-[10px] bg-black/60 px-1 rounded-tl text-white">
                    x{item.quantity}
                  </span>
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-900/95 border border-white/10 p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <p className="font-serif text-xs text-white font-bold">{item.name}</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-1">{item.description}</p>
                  {item.effect && <p className="text-[9px] text-emerald-400 mt-1 italic">{item.effect}</p>}
                </div>
              </>
            ) : (
              <span className="text-white/5 text-xs">+</span>
            )}
          </button>
        ))}
      </div>
    </FrostContainer>
  );
};
