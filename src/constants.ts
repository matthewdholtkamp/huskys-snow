import { Hammer, Shield, Heart, Zap, Flame, CloudLightning } from 'lucide-react'; // Using lucide-react directly
import type { Character, InventoryItem, Badge } from './types';

// --- Item Registry ---
export const ITEMS_REGISTRY: Record<string, Omit<InventoryItem, 'quantity' | 'id'>> = {
  'aloe': {
    name: 'Aloe Leaf',
    description: 'Soothing plant gel. Heals burns and minor wounds.',
    icon: '🌿',
    effect: 'Heals 5 HP',
    category: 'consumable',
    consumable: true
  },
  'spiderweb': {
    name: 'Spiderweb',
    description: 'Sticky silk. Stops bleeding or can be used for crafting.',
    icon: '🕸️',
    effect: 'Stops bleeding or helps with crafting',
    category: 'consumable',
    consumable: true
  },
  'berry': {
    name: 'Healing Berry',
    description: 'A sweet, red berry that restores energy.',
    icon: '🍒',
    effect: 'Heals 3 HP',
    category: 'consumable',
    consumable: true
  },
  'net': {
    name: 'Fishing Net',
    description: 'Woven by Shiver. Good for catching fish or tripping foes.',
    icon: '🥅',
    effect: 'Traps a target',
    category: 'tool',
    consumable: true
  },
  'crystal': {
    name: 'Frost Crystal',
    description: 'A shard of pure ice magic. Cold to the touch.',
    icon: '💎',
    effect: 'Unknown power',
    category: 'quest',
    consumable: false
  },
  'trap': {
    name: 'Snare Trap',
    description: 'A simple wire trap for small game.',
    icon: '⚙️',
    effect: 'Immobilizes a target',
    category: 'tool',
    consumable: true
  },
  'moss': {
    name: 'Soft Moss',
    description: 'Good for bedding or padding splints.',
    icon: '🌱',
    effect: 'Comfort or crafting material',
    category: 'consumable',
    consumable: true
  },
  'tinker_kit': {
    name: 'Tinker Kit',
    description: 'Fold-out hooks, wire, chalk, and tiny tools for clever plans and repairs.',
    icon: '🧰',
    effect: 'Reusable tool • Smart solutions',
    category: 'tool',
    consumable: false
  },
  'snare_launcher': {
    name: 'Snare Launcher',
    description: 'A harness-mounted rope launcher for catching, pulling, or tripping from a safe distance.',
    icon: '🪢',
    effect: 'Reusable weapon • Control a threat',
    category: 'weapon',
    consumable: false
  },
  'frostguard_spear': {
    name: 'Frostguard Spear',
    description: 'A short frostwood spear carried in a harness loop. It breaks ice and keeps threats back.',
    icon: '🗡️',
    effect: 'Reusable weapon • Strength and defense',
    category: 'weapon',
    consumable: false
  },
  'herb_satchel': {
    name: 'Healer Satchel',
    description: 'A refillable pouch of wraps, herbs, and sweet-smelling salts for field care.',
    icon: '🎒',
    effect: 'Reusable tool • Aid and recovery',
    category: 'tool',
    consumable: false
  },
  'river_sling': {
    name: 'Riverstone Sling',
    description: 'A light sling for hitting switches or distracting danger without getting close.',
    icon: '🎯',
    effect: 'Reusable weapon • Agility at range',
    category: 'weapon',
    consumable: false
  },
  'thunder_ram': {
    name: 'Thunder Ram',
    description: 'A reinforced shoulder guard that focuses Storm\'s lightning into a powerful charge.',
    icon: '⚡',
    effect: 'Reusable weapon • Break barriers',
    category: 'weapon',
    consumable: false
  }
};

export const STARTER_ITEM_BY_CHARACTER: Record<string, string> = {
  shiver: 'tinker_kit',
  oak: 'snare_launcher',
  glacier: 'frostguard_spear',
  flurry: 'herb_satchel',
  spruce: 'river_sling',
  storm: 'thunder_ram',
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
        small: { id: 'init_fish', ...BADGES_REGISTRY['catch_fish'], earnedAt: null },
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
  },
  {
    id: 'spruce',
    name: 'Spruce',
    role: 'The Witty Hunter',
    description: 'The jokester and morale engine of the pack. The fastest of all the pups, who uses humor to defuse fear.',
    stats: { strength: 11, agility: 18, smart: 13, spirit: 12 },
    ability: 'Blazing Dash',
    color: 'bg-orange-500',
    icon: Flame,
    visuals: {
      harnessColor: 'Lightweight Camo with Hood',
      features: ['Dark Brown with White Underside', 'Hood + Tail Cover', 'Rope Strapped to Side'],
      badgeSlots: { small: null, medium: null, large: null }
    },
    loreContext: `SPRUCE (Player): The witty hunter and comic relief.
    - VISUAL: Dark brown coat with a white underside. Wears a Lightweight Camo Harness with a hood, a tail cover, and rope strapped to the side.
    - PERSONALITY: Sarcastic, fast-talking, confident, brave. "I'm the one who does jokes around here!" Fastest of all pups. Defuses fear.
    - ABILITY: Blazing Dash [fire] (scout or joke to restore Pack Heart).
    - RELATIONS: Sister to Oak and Pine. Daughter of Falcon (deceased).
    - STORY: Often scouts ahead and leads from the front with quick humor.`,
    startingScene: "You leap over a fallen pine log, landing with a quick grin. Your lightweight camo harness is secure, the rope bobbing on your side. Spruce is here, and where Spruce goes, the laughter follows! Ahead, the wind carries a strange, oily smell from the river. Time to scout."
  },
  {
    id: 'storm',
    name: 'Storm',
    role: 'The Abrasive Fighter',
    description: 'Shiver\'s arrogant rival brother. Powerful, proud, and blunt, but secretly caring and deeply loyal.',
    stats: { strength: 18, agility: 13, smart: 11, spirit: 12 },
    ability: 'Thunder Charge',
    color: 'bg-rose-600',
    icon: CloudLightning,
    visuals: {
      harnessColor: 'Black Armor',
      features: ['Dark Grey with Grey Underbelly', 'Dark Blue Eyes', 'Black Armor'],
      badgeSlots: { small: null, medium: null, large: null }
    },
    loreContext: `STORM (Player): The abrasive rival fighter.
    - VISUAL: Dark grey coat, grey underbelly, dark blue eyes. Wears heavy Black Armor Harness.
    - PERSONALITY: Arrogant, abrasive rival. Brags, calls others "fluffbrained" or "floppedy fish". Not evil; softens and joins the group later. Strong and blunt.
    - ABILITY: Thunder Charge [red lightning] (powerful strike / force barriers back).
    - RELATIONS: Brother to Shiver, Glacier, Frostbite, Cold. Son of Mouse & Snapper.
    - STORY: Demands to join the quest at the boundary line, bringing muscle and red lightning magic.`,
    startingScene: "You snarl, flexing your strong paws in the snow. Your heavy black armor harness makes you feel invulnerable. Glacier claims she's strong, but you know you're the one with the sharpest teeth and strongest paws here. You'll show them all who's the real hero of the pack."
  }
];

// --- Spirit Cards Registry (T4) ---
export interface SpiritCard {
  id: string;
  name: string;
  element: 'shiver' | 'flurry' | 'oak' | 'glacier' | 'luna';
  color: string;
  unlockedAtChapter: string;
  lore: string;
  sigil: string;
}

export const SPIRIT_CARDS: SpiritCard[] = [
  {
    id: 'mist',
    name: 'Mistyfeather (Mist)',
    element: 'shiver',
    color: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.1)]',
    unlockedAtChapter: 'chapter_1',
    lore: "Mist warns the trainee pups of the incoming frost rot. She speaks in the minds of those who will listen: 'The frost is not a force of nature, little star. It is a choice.'",
    sigil: '🦉'
  },
  {
    id: 'starwhirl',
    name: 'Starwhirl',
    element: 'glacier',
    color: 'text-sky-300 border-sky-500/30 bg-sky-500/5 shadow-[0_0_15px_rgba(14,165,233,0.1)]',
    unlockedAtChapter: 'chapter_2',
    lore: "The legendary husky patriarch who first saw the stars rotate in the sky. He guides the elders with deep wisdom: 'The path is written in the sky, but walked on the snow.'",
    sigil: '🌀'
  },
  {
    id: 'dragonfly',
    name: 'Dragonfly',
    element: 'oak',
    color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    unlockedAtChapter: 'chapter_5',
    lore: "Dragonfly stands like an oak against the wind. She guards the camp boundary lines with endless vigilance and protective concerns: 'A pack is only as safe as its boundary.'",
    sigil: '🛡️'
  },
  {
    id: 'sweetbrush',
    name: 'Sweetbrush',
    element: 'flurry',
    color: 'text-amber-300 border-amber-500/30 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
    unlockedAtChapter: 'chapter_6',
    lore: "Sweetbrush gathered healing herbs for three generations of the Moonshine River Pack. Her spirit now warms the frozen soil: 'Every leaf is a breath of the forest.'",
    sigil: '🌿'
  },
  {
    id: 'lunarprie',
    name: 'Lunarprie',
    element: 'luna',
    color: 'text-purple-300 border-purple-500/30 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
    unlockedAtChapter: 'chapter_7',
    lore: "The ancient spirit of the moon itself. She watches over the trainees' trials from her starry throne: 'The river flows, the moon shines, and the pack endures.'",
    sigil: '🌙'
  }
];

// --- NPC Registry ---
export interface NPC {
  id: string;
  name: string;
  look: string;
  personality: string;
  voice: string;
  role: string;
}

export const NPCS: NPC[] = [
  {
    id: 'mist',
    name: 'Mistyfeather (Mist)',
    look: 'Black fur (blackened by dark spirits), black void eyes. Young.',
    personality: 'Monotone, sarcastic, creepy-calm, protective of Shiver.',
    voice: 'Creepy-calm, monotone, dry one-liners.',
    role: 'Telepathic Guide'
  },
  {
    id: 'starwhirl',
    name: 'Starwhirl',
    look: 'Black with white underbelly, star-shaped spot on forehead. Dark-purple harness with glittery stars.',
    personality: 'Noble, kind, a bit literal (misses jokes), young and newer to leadership than she seems.',
    voice: 'Noble and authoritative.',
    role: 'Pack Leader'
  },
  {
    id: 'sweetbrush',
    name: 'Sweetbrush',
    look: 'Golden-eyed border collie (only non-husky). Wise.',
    personality: 'Wise, strict-but-kind, gathers herbs daily.',
    voice: 'Wise, nurturing, strict but warm.',
    role: 'Pack Healer'
  },
  {
    id: 'dragonfly',
    name: 'Dragonfly',
    look: 'Dark brown, wild turquoise eyes.',
    personality: 'Over-protective to the point of hostility, blames Shiver for Oak\'s leg, loves Oak fiercely.',
    voice: 'Anxious, sharp, protective.',
    role: 'Oak\'s Mother'
  },
  {
    id: 'frostbite',
    name: 'Frostbite',
    look: 'Shiver\'s brother. Normal husky coat, no magic.',
    personality: 'Silly and fast. Copy-cat companion to Cold.',
    voice: 'Goofy, playful, enthusiastic.',
    role: 'Background Pack Member'
  },
  {
    id: 'cold',
    name: 'Cold',
    look: 'Shiver\'s brother. Normal husky coat, no magic.',
    personality: 'Serious and stronger. Copy-cat companion to Frostbite.',
    voice: 'Serious, short-spoken.',
    role: 'Background Pack Member'
  },
  {
    id: 'quicksand',
    name: 'Quicksand',
    look: 'Coyote. Light brown with black swirls, one blue + one gold eye, missing an ear, stumpy tail.',
    personality: 'Fierce, teasing, dramatic (pauses for suspense), befriends Glacier.',
    voice: 'Dramatic, teasing, fierce.',
    role: 'Amberwood Coyote Pup'
  },
  {
    id: 'thorn',
    name: 'Thorn',
    look: 'Coyote. Yellow eyes.',
    personality: 'Gruff, suspicious, growly, uneasy around Mist.',
    voice: 'Gruff and defensive.',
    role: 'Quicksand\'s Brother'
  },
  {
    id: 'floral',
    name: 'Floral',
    look: 'Small coyote pup (~4 months). Bubbly, naturally stealthy.',
    personality: 'Bubbly, talks in breathless run-on sentences, eager to learn crafting from Shiver.',
    voice: 'High-speed, bubbly run-on sentences.',
    role: 'Coyote Pup'
  }
];
