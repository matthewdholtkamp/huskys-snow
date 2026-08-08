import type { Message, Player, GameSession } from '../src/types';
import { CHARACTERS } from '../src/constants';

const DEFAULT_WORKER_URL = 'https://husky-snow-ai.mholtkamp.workers.dev';
const PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';
const SUMMARIZER_MODEL = 'gemini-3.1-flash-lite';
const HISTORY_THRESHOLD = 20;
const RECENT_HISTORY_COUNT = 10;
const REQUEST_TIMEOUT_MS = 30_000;

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

interface AIResponse {
  narrative: string;
  suggestions: string[];
  commands: string[];
  suggestionsByPup?: Record<string, string[]>;
}

interface WorkerContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface WorkerGenerateResponse {
  text?: string;
  finishReason?: string | null;
  model?: string;
  error?: string;
  details?: string;
}

const getWorkerUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_HUSKY_AI_WORKER_URL || DEFAULT_WORKER_URL;
  return configuredUrl.replace(/\/+$/, '');
};

const callWorker = async (payload: Record<string, unknown>): Promise<WorkerGenerateResponse> => {
  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    response = await fetch(`${getWorkerUrl()}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Quinn took too long to answer. Try the story again.');
    }
    throw new Error('The Husky Snow AI Worker is unavailable. Check VITE_HUSKY_AI_WORKER_URL or deploy the Worker.');
  } finally {
    clearTimeout(timeoutId);
  }

  const data = (await response.json().catch(() => ({}))) as WorkerGenerateResponse;

  if (!response.ok) {
    const message = data.error || `The storyteller service returned ${response.status}.`;
    const detail = data.details ? ` ${data.details}` : '';
    throw new Error(`${message}${detail}`);
  }

  return data;
};

const generateText = async ({
  model,
  fallbackModel,
  systemInstruction,
  contents,
  generationConfig,
}: {
  model: string;
  fallbackModel?: string;
  systemInstruction: string;
  contents: WorkerContent[];
  generationConfig: Record<string, unknown>;
}): Promise<string> => {
  const result = await callWorker({
    model,
    fallbackModel,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig,
    safetySettings: SAFETY_SETTINGS,
  });

  if (result.text) {
    return result.text;
  }

  if (result.finishReason && result.finishReason !== 'STOP') {
    throw new Error(`The spirits blocked this action (${result.finishReason}).`);
  }

  throw new Error('The spirits are silent.');
};

export const summarizeHistory = async (historyToSummarize: Message[]): Promise<string> => {
  const summarizationPrompt = `
You are a story summarizer for a text-based RPG called "Husky's Snow".
Concise summary only. Focus on key plot points, character actions, locations visited, major decisions, items acquired, badges earned, and unresolved threats.
This recap will be used as context for the storyteller AI.

HISTORY:
${historyToSummarize.map((m) => `(${m.author || m.role}): ${m.text}`).join('\n')}
`;

  try {
    return await generateText({
      model: SUMMARIZER_MODEL,
      systemInstruction: 'Summarize only the supplied Husky Snow RPG history. Do not continue the story.',
      contents: [{ role: 'user', parts: [{ text: summarizationPrompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 500,
      },
    });
  } catch (e) {
    console.error('History summarization failed:', e);
    return 'The story so far is a blur, but the adventure continues...';
  }
};

const buildSystemInstruction = (gameData: GameSession | null, playersOverride?: Player[]): string => {
  const players = playersOverride || gameData?.players || [];
  const allPlayerLore = players
    .map((p) => {
      const char = CHARACTERS.find((c) => c.name.toLowerCase() === p.charName.toLowerCase());
      return char ? char.loreContext : `${p.charName} (Unknown Lore)`;
    })
    .join('\n');

  // Format the LIVE PARTY STATE block
  const chapterId = gameData?.chapterId || 'chapter_1';
  const objective = gameData?.objective || 'Investigate the Moonshine River and find out what is making the water sick.';
  const scene = gameData?.scene || 'river';
  const currentTurnIndex = gameData?.currentTurnIndex;
  const turnOrder = gameData?.turnOrder || [];
  const activeTurnPlayer = (currentTurnIndex !== undefined && turnOrder[currentTurnIndex]) 
    ? turnOrder[currentTurnIndex] 
    : 'None';
  const packHeart = gameData?.packHeart !== undefined ? gameData.packHeart : 100;

  const playersState = players.map(p => {
    const invStr = p.inventory && p.inventory.length > 0 
      ? p.inventory.map(i => `${i.name} (x${i.quantity})`).join(', ') 
      : 'None';
    const badgeStr = p.badges && p.badges.length > 0 
      ? p.badges.map(b => b.name).join(', ') 
      : 'None';
    const isDowned = (p.hp ?? 100) <= 0;
    const cooldown = p.abilityCooldownChapter || 'None';
    return `- ${p.charName}: HP ${p.hp}/${p.maxHp || 100} (${isDowned ? 'DOWNED' : 'Conscious'}), Rank: ${p.rank || 'Pup'}, Surge Cooldown: ${cooldown}, Inventory: ${invStr}, Badges: ${badgeStr}`;
  }).join('\n');

  const liveStateBlock = `
=== LIVE PARTY STATE ===
- Active Chapter: ${chapterId}
- Current Objective: "${objective}"
- Active Scene: ${scene}
- Pack Heart: ${packHeart}
- Turn Order: ${turnOrder.join(' ➔ ') || 'None'}
- Active Turn Player: ${activeTurnPlayer}

=== PLAYERS STATE ===
${playersState}
========================
`;

  return `
You are Quinn, the storyteller for a cinematic text RPG called "Husky's Snow: Tales of the Moonshine River Pack".

YOUR GOAL:
Provide an immersive "Frostglass Fantasy" experience for young adventurers in the Moonshine River Pack. Stay fully in Husky Snow's world. Do not use or mention any Band-Aid six persona, military persona, hospital persona, or unrelated app identity.

STYLE GUIDELINES:
- Write for ages 11–14 at roughly a grade 6–8 reading level. Prefer concrete words and sentences under 20 words.
- Keep normal turns to 45–80 words and 2–4 sentences unless the user explicitly asks for a recap.
- Write atmospheric, wintery, tactile prose with sensory detail, but keep the game moving quickly.
- Use *italics* for emphasis or inner thoughts and **bold** for key terms or dice requests.
- Give players a clear next step every turn. Do not strand them with vague ambience or dead-end suggestions.
- Never reveal hidden commands to the player as explanatory text.

GAMEPLAY MECHANICS:
1. DICE ROLLS:
   - If a player attempts an uncertain action, do not resolve the outcome immediately.
   - Describe the challenge and command exactly: "**Roll the D20 + [STAT] to [action].**" where [STAT] is one of: STR (Strength), AGI (Agility), INT (Smart), or SPI (Spirit). Choose the stat that best fits the action.
   - Do not resolve the action until the player's roll TOTAL is provided.
   - Interpret the TOTAL (not the raw die) to determine the outcome:
     * Natural 1 or TOTAL <= 1: Critical Fail (crit fumble)
     * TOTAL 2-10: Failure
     * TOTAL 11-15: Success
     * Natural 20 or TOTAL >= 16: Critical Success
   - Never ask for another roll until the previous roll result has been interpreted.
   - One player choice can cause at most one roll. After a roll result, resolve the challenge and return control with three useful choices. Never request a second roll in that response.
   - Failure must move the story forward with a complication, clue, or changed route. Do not repeat the same task. Use 0–5 damage for ordinary failures and keep the tone tense but hopeful.
   - A Spirit Surge or matching item can replace a pending roll. Resolve it as progress and do not request another roll in that response.

2. HIDDEN STATE COMMANDS:
   Put state commands at the very end of your response on separate lines.
   - Give item: [[ADD_ITEM: PlayerName | ItemId]]
   - Award badge: [[AWARD_BADGE: PlayerName | BadgeId]]
   - Inflict damage: [[DAMAGE: PlayerName | N]] (use reasonable small numbers, e.g., 5 to 20, when players fail rolls, trigger traps, or get hurt)
   - Restore health: [[HEAL: PlayerName | N]] (when players rest, consume items, or receive healing support)
   - Change active scene: [[SCENE: scene_id]] (scene_ids: cave, forest, river, snowfield, ravine, road, coyote_camp, dreamland)
   - Complete active chapter: [[COMPLETE_OBJECTIVE: chapter_id]]
   - Award Pack Heart: [[HEART: +N | value | reason]] (value can be: courage, empathy, teamwork, perseverance. Give +10 or +15 when pups do something brave, helpful, cooperative, or keep trying after a failure). Name the value gently at most once per scene.
   - Item IDs: aloe, spiderweb, berry, net, crystal, trap, moss, tinker_kit, snare_launcher, frostguard_spear, herb_satchel, river_sling, thunder_ram
   - Badge IDs: catch_fish, save_pup, brave_stand, legend_pack

3. PER-PUP SYNCP SUGGESTIONS:
   For every active playable pup in the session, you must output a suggestions command at the very end of your response on its own line:
   [[SUGGESTIONS: PupName | suggestion 1 ; suggestion 2 ; suggestion 3]]
   Suggestions must be specific, actionable, and tailored to that pup's personality and elements (e.g. Shiver being crafty/smart, Glacier being fierce/protective, Storm being blunt/boastful, Spruce being fast/witty, etc.). Do not output normal bulleted list suggestions starting with "-" anymore; use this format exclusively.

4. PACING & EPISODIC BEATS:
   - Stay aligned with the current active chapter's intro, beats, and climax.
   - You must NOT emit [[COMPLETE_OBJECTIVE: chapter_id]] until the players have completed at least 3 distinct story beats for the chapter and resolved the chapter's climax.
   - Aim for a 12–18 minute chapter with three distinct beats and a climax. Offer optional exploration paths but keep the book spine intact.

CANON WORLD & CHARACTER BIBLE (TREAT AS LAW):
- Magic elements: Only the seven quest pups have magic (Shiver = icy blue sparkles, Glacier = silver water droplets, Oak = white wind streaks, Flurry = gold healing motes, Spruce = fire embers on tail, Storm = crackling red lightning bolts, Mistyfeather = shadow wisps).
- Other pups: Frostbite and Cold are background NPCs only (silly and fast/serious and strong, respectively; they stay at camp and have NO magic).
- Mistyfeather (Mist) is the telepathic NPC guide with black void eyes. She is monotone, sarcastic, and creepy-calm.
- Character strengths: Glacier and Storm are tied strongest (STR 18). Shiver is smartest (INT 18). Spruce is fastest (AGI 18).
- Shiver's Word-Correction Trait: When another character or the player actually uses a made-up word, Shiver corrects it once and briefly. Never invent a fake mistake just to trigger this trait.
- Ending: The final choice is Light (restore) or Dark (destroy) and remains a placeholder. Do not fabricate a book ending.

LIVE GAME STATE BLOCK (CRITICAL):
Use this live state block to remain synchronized and prevent memory drift.
${liveStateBlock}

PLAYERS LORE:
${allPlayerLore}
`;
};

const parseAIText = (aiText: string): AIResponse => {
  const lines = aiText.split('\n');
  const narrativeLines: string[] = [];
  const suggestionLines: string[] = [];
  const commandLines: string[] = [];
  const suggestionsByPup: Record<string, string[]> = {};

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('[[') && trimmed.endsWith(']]')) {
      const content = trimmed.substring(2, trimmed.length - 2).trim();
      const firstColon = content.indexOf(':');
      if (firstColon !== -1) {
        const action = content.substring(0, firstColon).trim();
        const argsStr = content.substring(firstColon + 1).trim();
        
        if (action === 'SUGGESTIONS') {
          const pipeIdx = argsStr.indexOf('|');
          if (pipeIdx !== -1) {
            const rawPupName = argsStr.substring(0, pipeIdx).trim();
            const suggestionsList = argsStr.substring(pipeIdx + 1)
              .split(';')
              .map(s => s.trim())
              .filter(Boolean);
            
            const pupName = rawPupName.charAt(0).toUpperCase() + rawPupName.slice(1).toLowerCase();
            suggestionsByPup[pupName] = suggestionsList;
          }
        } else {
          commandLines.push(trimmed);
        }
      } else {
        commandLines.push(trimmed);
      }
    } else if (trimmed.startsWith('-')) {
      suggestionLines.push(trimmed.substring(1).trim());
    } else {
      narrativeLines.push(line);
    }
  });

  return {
    narrative: narrativeLines.join('\n').trim(),
    suggestions: suggestionLines.filter(Boolean),
    commands: commandLines,
    suggestionsByPup,
  };
};

export const generateAIResponse = async (
  history: Message[],
  prompt: string,
  gameData: GameSession | null,
  playersOverride?: Player[]
): Promise<AIResponse> => {
  let summary: string | null = null;
  let processedHistory = [...history];

  if (processedHistory.length > HISTORY_THRESHOLD) {
    const oldHistory = processedHistory.slice(0, -RECENT_HISTORY_COUNT);
    const recentHistory = processedHistory.slice(-RECENT_HISTORY_COUNT);
    summary = await summarizeHistory(oldHistory);
    processedHistory = recentHistory;
  }

  const contents: WorkerContent[] = processedHistory
    .filter((m) => m.role !== 'system' && m.role !== 'error' && m.text.trim() !== '')
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: `(${m.author || m.role}): ${m.text}` }],
    }));

  if (summary) {
    contents.unshift({
      role: 'model',
      parts: [{ text: `--- STORY RECAP ---\n${summary}\n--- END RECAP ---` }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const text = await generateText({
    model: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
    systemInstruction: buildSystemInstruction(gameData, playersOverride),
    contents,
    generationConfig: {
      maxOutputTokens: 650,
      temperature: 0.8,
    },
  });

  return parseAIText(text);
};
