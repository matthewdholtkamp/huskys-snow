import { LucideProps } from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { Timestamp } from 'firebase/firestore';

export type IconType = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

export interface Badge {
  id: string;
  name: string;
  type: 'small' | 'medium' | 'large';
  description: string;
  icon?: string; // Could be a lucide icon name or image path
  earnedAt?: Timestamp;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or Lucide icon name
  effect?: string;
  quantity: number;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  stats: {
    strength: number;
    agility: number;
    smart: number;
    spirit: number;
  };
  ability: string;
  color: string;
  icon: IconType;
  loreContext: string;
  startingScene: string;
  visuals: {
    harnessColor: string;
    features: string[]; // e.g., ["Thin fur", "Mismatched eyes"]
    badgeSlots: {
      small: Badge | null;
      medium: Badge | null;
      large: Badge | null;
    };
  };
}

export type Player = {
  userId: string;
  charName: string;
  inventory?: InventoryItem[];
  badges?: Badge[];
};

export type Message = {
  id: string;
  role: 'user' | 'model' | 'system' | 'error';
  text: string;
  author?: string; // Character Name
  isRoll?: boolean;
  rollOutcome?: string; // "Success" | "Failure" | "Critical Success" etc.
  timestamp: Timestamp;
  suggestions?: string[];
};

export type GameSession = {
  id: string;
  hostId: string;
  players: Player[];
  createdAt: Timestamp;
  // Game state
  inventory: Record<string, InventoryItem[]>; // map charName -> items
  badges: Record<string, Badge[]>; // map charName -> badges
};

export type GameState = 'intro' | 'lobby' | 'selection' | 'playing';
