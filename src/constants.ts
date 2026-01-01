import { Hammer, Shield, Heart, Zap } from 'lucide-react'; // Using lucide-react directly
import type { Character, InventoryItem, Badge } from './types';

// --- Item Registry ---
export const ITEMS_REGISTRY: Record<string, Omit<InventoryItem, 'quantity' | 'id'>> = {
  'aloe': {
    name: 'Aloe Leaf',
    description: 'Soothing plant gel. Heals burns and minor wounds.',
    icon: '🌿',
    effect: 'Heals 5 HP'
  },
  'spiderweb': {
    name: 'Spiderweb',
    description: 'Sticky silk. Stops bleeding or can be used for crafting.',
    icon: '🕸️',
    effect: 'Stops Bleeding / Crafting Material'
  },
  'berry': {
    name: 'Healing Berry',
    description: 'A sweet, red berry that restores energy.',
    icon: '🍒',
    effect: 'Heals 3 HP'
  },
  'net': {
    name: 'Fishing Net',
    description: 'Woven by Shiver. Good for catching fish or tripping foes.',
    icon: '🥅',
    effect: 'Traps Target'
  },
  'crystal': {
    name: 'Frost Crystal',
    description: 'A shard of pure ice magic. Cold to the touch.',
    icon: '💎',
    effect: 'Unknown Power'
  },
  'trap': {
    name: 'Snare Trap',
    description: 'A simple wire trap for small game.',
    icon: '⚙️',
    effect: 'Immobilizes Target'
  },
  'moss': {
    name: 'Soft Moss',
    description: 'Good for bedding or padding splints.',
    icon: '🌱',
    effect: 'Comfort / Crafting'
  }
};

// --- Badge Registry ---
export const BADGES_REGISTRY: Record<string, Omit<Badge, 'id' | 'earnedAt'>> = {
  'catch_fish': {
    name: 'Fisher Pup',
    type: 'small',
    description: 'Caught a giant fish for the pack.',
    icon: '🐟'
  },
  'save_pup': {
    name: 'Life Saver',
    type: 'medium',
    description: 'Saved a packmate from danger.',
    icon: '❤️'
  },
  'brave_stand': {
    name: 'Guardian',
    type: 'medium',
    description: 'Stood ground against a larger foe.',
    icon: '🛡️'
  },
  'legend_pack': {
    name: 'Pack Legend',
    type: 'large',
    description: 'Saved the Moonshine River Pack from ruin.',
    icon: '👑'
  }
};

// --- Characters ---
export const CHARACTERS: Character[] = [
  {
    id: 'shiver',
    name: 'Shiver',
    role: 'The Creative Crafter',
    description: 'The protagonist with mismatched eyes and thin fur. She hears a mysterious telepathic voice ("Mist") and uses creativity to solve problems.',
    stats: { strength: 8, agility: 12, smart: 18, spirit: 16 },
    ability: 'Crafting & Telepathy',
    color: 'bg-indigo-500',
    icon: Hammer,
    visuals: {
      harnessColor: 'Blue-to-Brown Fade',
      features: ['Thin Fur', 'Mismatched Eyes (Blue/Brown)', 'Warm Cloak'],
      badgeSlots: { small: null, medium: null, large: null }
    },
    loreContext: `SHIVER (Player): The creative crafter.
    - VISUAL: Thin fur (needs warmth), mismatched eyes (blue/brown). Wears a blue-fading-to-brown harness with a silver streak and a Warm Cloak attachment.
    - PERSONALITY: Creative, determined, "weakest-seeming" but sharp.
    - ABILITY: Crafting & Telepathy (Can hear Mist).
    - RELATIONS: Daughter of Snapper. Sister to Storm (Rival) and Glacier (Protector).
    - STORY: First to hear the telepathic voice of Mist/Mistyfeather.`,
    startingScene: "You wake up in the trainee den, shivering slightly. Your new blue-and-brown harness lies beside you with its warm cloak attachment. A sarcastic voice echoes in your mind: *'Finally awake, little star?'* It is Mist. Outside, Snapper is calling."
  },
  {
    id: 'oak',
    name: 'Oak',
    role: 'The Determined Hunter',
    description: 'Born missing a leg, but faster than anyone realizes. Uses traps and determination.',
    stats: { strength: 10, agility: 16, smart: 15, spirit: 15 },
    ability: 'Trap Mastery',
    color: 'bg-emerald-600',
    icon: Zap,
    visuals: {
      harnessColor: 'Dark Brown Camo',
      features: ['Missing Back Left Leg', 'White Star on Chest', 'Trap Pouches'],
      badgeSlots: {
        small: { id: 'init_fish', ...BADGES_REGISTRY['catch_fish'], earnedAt: null } as any,
        medium: null,
        large: null
      }
    },
    loreContext: `OAK (Player): The determined hunter.
    - VISUAL: Brown coat, white star, missing back left leg. Wears a Dark Brown Camo Harness with pouches for traps.
    - PERSONALITY: Determined to prove he isn't weak. Hates being coddled.
    - ABILITY: Trap Mastery (Nets/Snares).
    - RELATIONS: Son of Dragonfly (who is over-protective). Friend to Shiver.
    - FEAT: Already earned a Small Badge for catching a Giant Fish using a net.`,
    startingScene: "You stand by the river where you caught the giant fish. Your camo harness fits snugly over your three strong legs. You feel fast. Up on the ridge, your mother Dragonfly watches you with that suffocating worry in her eyes."
  },
  {
    id: 'glacier',
    name: 'Glacier',
    role: 'The Fierce Fighter',
    description: 'Strong, bold, and protective. She wears an ice-blue armored harness.',
    stats: { strength: 18, agility: 14, smart: 10, spirit: 12 },
    ability: 'Protective Strike',
    color: 'bg-cyan-600',
    icon: Shield,
    visuals: {
      harnessColor: 'Ice Blue Armor',
      features: ['Solid White Fur', 'Icy Blue Eyes', 'Big & Fluffy'],
      badgeSlots: { small: null, medium: null, large: null }
    },
    loreContext: `GLACIER (Player): The fierce fighter.
    - VISUAL: Solid white, icy eyes. Big and fluffy. Wears an Ice-Blue Armored Harness.
    - PERSONALITY: Smart, mischievous, fiercely protective of Shiver.
    - ABILITY: Protective Strike.
    - RELATIONS: Sister to Shiver and Storm. Idolizes Starwhirl.`,
    startingScene: "The cold air bites, but your thick white fur keeps you warm. You stand at the training circle, your armored harness glinting. Storm is bragging nearby. You roll your eyes. You know you're stronger."
  },
  {
    id: 'flurry',
    name: 'Flurry',
    role: 'The Gentle Healer',
    description: 'Small body but a mountain-sized heart. Knows which plants soothe wounds.',
    stats: { strength: 6, agility: 14, smart: 14, spirit: 18 },
    ability: 'Soothing Herbs',
    color: 'bg-purple-400',
    icon: Heart,
    visuals: {
      harnessColor: 'Lavender with Pouches',
      features: ['Small/Runt', 'Light Gray/White', 'Anxious Eyes'],
      badgeSlots: { small: null, medium: null, large: null }
    },
    loreContext: `FLURRY (Player): The gentle healer.
    - VISUAL: Small, light gray/white. Runt. Wears a Lavender Harness with herb pouches.
    - PERSONALITY: Anxious but brave. "Mountain-sized heart."
    - ABILITY: Soothing Herbs (Aloe, Spiderwebs).
    - RELATIONS: Apprentice to Sweetbrush (Border Collie).
    - STORY: Dreamt of the poisoned river first.`,
    startingScene: "The sharp scent of crushed herbs fills the Healer's Den. Sweetbrush, the golden-eyed Border Collie, nudges some aloe toward you. 'Pack your pouches, Flurry,' she says. 'The wind whispers of trouble.'"
  }
];
