export interface Ability {
  id: string;
  name: string;
  element: string;
  color: string; // Tailored color name
  vfxType: 'blue_orbs' | 'wind_streaks' | 'ice_shards' | 'gold_motes' | 'orange_embers' | 'red_bolts';
  description: string;
  type: 'advantage' | 'autosucceed' | 'shield' | 'heal';
  promptTemplate: string;
}

export const ELEMENT_MAGIC: Record<string, { color: string; hex: string }> = {
  shiver: { color: 'icy blue', hex: '#60a5fa' },
  flurry: { color: 'gold', hex: '#f59e0b' },
  oak: { color: 'wind-white', hex: '#f8fafc' },
  glacier: { color: 'silver/ice', hex: '#cbd5e1' },
  spruce: { color: 'fire orange', hex: '#f97316' },
  storm: { color: 'red lightning', hex: '#e11d48' },
};

export const ABILITIES: Record<string, Ability> = {
  shiver: {
    id: 'minds_eye',
    name: 'Mind\'s Eye',
    element: 'Telepathy',
    color: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
    vfxType: 'blue_orbs',
    description: 'Reveal a hidden clue or automatically clear a Smart check with a warning from Mist.',
    type: 'autosucceed',
    promptTemplate: 'Shiver channels her crafting and telepathic magic—a swirling blue light of orbs forms around her eyes as she reaches out to touch the spirits or construct a clever plan...'
  },
  oak: {
    id: 'hunters_dash',
    name: 'Hunter\'s Dash',
    element: 'Trap Mastery',
    color: 'text-slate-100 border-slate-300/40 bg-slate-500/10',
    vfxType: 'wind_streaks',
    description: 'Quickly dash to automatically succeed on the next Agility check or deploy a trap.',
    type: 'autosucceed',
    promptTemplate: 'Oak uses Hunter\'s Dash! A flash of white wind streaks around him as he moves with unexpected speed and determination...'
  },
  glacier: {
    id: 'ice_guard',
    name: 'Ice Guard',
    element: 'Protective Strike',
    color: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
    vfxType: 'ice_shards',
    description: 'Shield a packmate or automatically clear a Strength-based defense with silver ice.',
    type: 'autosucceed',
    promptTemplate: 'Glacier summons an Ice Guard! Gleaming silver shards of ice form a shield around her packmate, standing bold and ready to protect...'
  },
  flurry: {
    id: 'soothing_light',
    name: 'Soothing Light',
    element: 'Soothing Herbs',
    color: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
    vfxType: 'gold_motes',
    description: 'Bridges soothing golden motes of healing light to restore 25 HP to a packmate.',
    type: 'heal',
    promptTemplate: 'Flurry channels her healing magic—glowing gold motes of soothing light bloom from her pouches and wash over her packmate, closing wounds and restoring strength...'
  },
  spruce: {
    id: 'blazing_dash',
    name: 'Blazing Dash',
    element: 'Fire Magic',
    color: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    vfxType: 'orange_embers',
    description: 'Auto-succeed on an Agility-based chase/escape/scout or crack a joke that restores 15 Pack Heart.',
    type: 'autosucceed',
    promptTemplate: 'Spruce dashes forward with Blazing Dash! Orange embers and fire burst around her tail as she scouts ahead or cracks a witty joke...'
  },
  storm: {
    id: 'thunder_charge',
    name: 'Thunder Charge',
    element: 'Red Lightning',
    color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
    vfxType: 'red_bolts',
    description: 'Break a barrier or automatically clear a Strength challenge with red lightning.',
    type: 'autosucceed',
    promptTemplate: 'Storm launches a Thunder Charge! Red crackling lightning bolts spark from his black armor as he shoves a barrier or enemy aside with unmatched power...'
  }
};
