
import type { Character } from './types';
import { Hammer, Shield, Heart, Zap } from './components/icons';

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
    loreContext: "SHIVER (Player): The protagonist. Has thin fur and unique mismatched eyes (blue and brown in one iris). She is the daughter of Snapper (the pack's master crafter) and Mouse. She is often underestimated but is determined and creative. She has a contentious relationship with her mean older brother, Storm. She is the first to hear the telepathic voice of Mist/Mistyfeather, a mysterious dark husky who guides her.",
    startingScene: "You wake up in the trainee den, the morning light filtering through the entrance. Your new blue-and-brown crafter harness lies beside you; it has a special cloak attached for warmth because of your thin fur. Suddenly, a sarcastic voice echoes in your mind: *'Finally awake, little star? We have work to do.'* It is Mist. Outside, you can hear your father, Snapper, calling for you to begin your training."
  },
  {
    id: 'glacier',
    name: 'Glacier',
    role: 'The Fierce Fighter',
    description: 'Strong, bold, and protective. She wears an ice-blue armored harness and defends the pack with bravery.',
    stats: { strength: 18, agility: 14, smart: 10, spirit: 12 },
    ability: 'Protective Strike',
    color: 'bg-cyan-600',
    icon: Shield,
    loreContext: "GLACIER (Player): Shiver's sister. A strong, bold, and fiercely protective pup with solid white fur and icy eyes. She is a fighter trainee who idolizes the pack leader, Starwhirl. While brave and impulsive, she is deeply loyal to her friends and family, especially Shiver.",
    startingScene: "The cold air bites at your nose, but you barely feel it. You stand at the edge of the training circle, your ice-blue armored harness glinting in the sun. The older fighters are watching. Today is sparring day. Your mean brother Storm is nearby, bragging about his strength. You know you are stronger than him."
  },
  {
    id: 'flurry',
    name: 'Flurry',
    role: 'The Gentle Healer',
    description: 'Small body but a mountain-sized heart. She learns from Sweetbrush and knows which plants soothe wounds.',
    stats: { strength: 6, agility: 14, smart: 14, spirit: 18 },
    ability: 'Soothing Herbs',
    color: 'bg-purple-400',
    icon: Heart,
    loreContext: "FLURRY (Player): A small, light gray and white pup who is the runt of her litter. Despite her size, she has a huge, kind heart. She is a healer trainee under the pack's healer, a wise Border Collie named Sweetbrush. She is anxious but gentle, and knows the secrets of healing herbs. She is the first to receive the prophecy about the poisoned river in a dream.",
    startingScene: "The sharp scent of crushed herbs fills your nose. You are inside the Healer's Cave. Sweetbrush, the wise Border Collie, is sorting berries nearby. 'Flurry,' she barks gently, 'The hunters will be back soon. Check your lavender harness. Do you have enough aloe and spiderwebs? We might need them.'"
  },
  {
    id: 'oak',
    name: 'Oak',
    role: 'The Determined Hunter',
    description: 'Born missing a leg, but faster than anyone realizes. He uses traps and determination to prove he is not weak.',
    stats: { strength: 10, agility: 16, smart: 15, spirit: 15 },
    ability: 'Trap Mastery',
    color: 'bg-emerald-600',
    icon: Zap,
    loreContext: "OAK (Player): A determined pup born missing his back left leg. His mother, Dragonfly, is fiercely overprotective of him, which frustrates his desire for independence. He is a skilled and surprisingly fast hunter who wants to prove he is not weak. Shiver created a special camo harness for him, and he proved his skill by catching a giant fish with a net.",
    startingScene: "You are standing by the rushing river, the spray cool on your face. This is where you caught the giant fish. Your camo harness fits snugly, holding the nets and traps Shiver made for you. Your missing leg doesn't bother you—you are fast. But up on the ridge, you see your mother, Dragonfly, watching you with a worried, angry look."
  }
];
