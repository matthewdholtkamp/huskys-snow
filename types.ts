import { LucideProps } from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { Timestamp } from 'firebase/firestore';

// A generic type for lucide-react icons
export type IconType = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

export type Character = {
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
};

export type Player = {
  userId: string;
  charName: string;
};

export type Message = {
  id: string;
  role: 'user' | 'model' | 'system' | 'error';
  text: string;
  author?: string; // Character Name
  isRoll?: boolean;
  timestamp: Timestamp;
};

export type GameSession = {
  id: string;
  hostId: string;
  players: Player[];
  createdAt: Timestamp;
  // We can add more game-wide state here later, like current quest, etc.
};

export type GameState = 'intro' | 'lobby' | 'selection' | 'playing';