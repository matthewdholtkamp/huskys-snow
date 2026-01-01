
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { Message, Player } from '../src/types'; // Updated import path
import { CHARACTERS } from '../src/constants'; // Updated import path
import { revealKey } from "./security";

// The user-provided API key is hardcoded here for deployment on a static host.
const API_KEY = revealKey("eE1zWS1PMHBaVXI1OGpwZHNlMTFwN01WbzBveHpsTm1RbEZubVZO");

const getAiClient = (): GoogleGenAI => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};


// --- History Management Constants ---
const HISTORY_THRESHOLD = 20; 
const RECENT_HISTORY_COUNT = 10;

interface AIResponse {
    narrative: string;
    suggestions: string[];
    commands: string[];
}

const summarizeHistory = async (historyToSummarize: Message[]): Promise<string> => {
    const ai = getAiClient();
    const summarizerModel = 'gemini-2.5-flash';
    const summarizationPrompt = `
        You are a story summarizer for a text-based RPG called "Husky's Snow".
        Concisely summarize the following conversation history. Focus on key plot points, character actions, locations visited, major decisions, and items acquired.
        This summary will be used as context for the storyteller AI, so it needs to be an effective recap of what has happened so far.
        ---
        HISTORY:
        ${historyToSummarize.map(m => `(${m.author}): ${m.text}`).join('\n')}
    `;

    try {
        const result = await ai.models.generateContent({
            model: summarizerModel,
            contents: summarizationPrompt,
            config: {
                temperature: 0.5,
            }
        });
        return result.text;
    } catch (e) {
        console.error("History summarization failed:", e);
        return "The story so far is a blur, but the adventure continues..."; 
    }
}

export const generateAIResponse = async (
  history: Message[],
  prompt: string,
  players: Player[]
): Promise<AIResponse> => {
    const ai = getAiClient();
    const allPlayerLore = players.map(p => {
      const char = CHARACTERS.find(c => c.name === p.charName);
      return char ? char.loreContext : `${p.charName} (Unknown Lore)`;
    }).join("\n");

    const systemInstructionText = `
      You are Quinn, the storyteller for a cinematic text RPG called "Husky's Snow: Tales of the Moonshine River Pack".

      **YOUR GOAL:** Provide an immersive, "Frostglass Fantasy" experience. Your writing should be atmospheric, slightly poetic, and cinematic.

      **STYLE GUIDELINES:**
      - **Length:** You can write slightly longer paragraphs (up to 4-5 sentences) to set the mood, but keep the pace moving.
      - **Tone:** Mysterious, wintery, tactile. Use sensory details (the crunch of snow, the smell of pine, the cold bite of wind).
      - **Formatting:** Use *italics* for emphasis or inner thoughts. Use **bold** for key terms or dice requests.

      **GAMEPLAY MECHANICS (CRITICAL):**

      1. **DICE ROLLS:** If an action is uncertain, describe the challenge and say "**Roll the D20 to [action].**" Do not describe the outcome yet.

      2. **HIDDEN COMMANDS:** You have control over the game state. Use the following commands at the END of your response (on new lines) to modify the game. These commands are invisible to the player.
         - **Give Item:** \`[[ADD_ITEM: PlayerName | ItemId]]\` (Item IDs: 'aloe', 'spiderweb', 'berry', 'net', 'crystal', 'trap', 'moss')
         - **Award Badge:** \`[[AWARD_BADGE: PlayerName | BadgeId]]\` (Badge IDs: 'catch_fish', 'save_pup', 'brave_stand', 'legend_pack')
         - **Example:** If Shiver finds berries, write: \`[[ADD_ITEM: Shiver | berry]]\`

      3. **SUGGESTIONS:** Always end with "What do you do?" and provide 3-4 clickable options starting with '-'.

      **LORE CONTEXT:**
      The Moonshine River is poisoned. The prophecy: "Find the crystal to save the pack."
      
      **PLAYERS:**
      ${allPlayerLore}

      **KEY NPCS:**
      - **Mistyfeather (Mist):** Telepathic guide. Black void eyes. Sarcastic.
      - **Starwhirl:** Pack Leader. Noble.
      - **Snapper:** Master Crafter. Shiver's dad.
      - **Sweetbrush:** Healer (Border Collie).
      - **Dragonfly:** Oak's mom. Over-protective antagonist.
      - **Storm:** Shiver's mean brother. Rival.

      **ITEMS REGISTRY (For ADD_ITEM):**
      - 'aloe' (Healing)
      - 'spiderweb' (Stops Bleeding)
      - 'berry' (Food)
      - 'net' (Trapping)
      - 'crystal' (Quest Item)
      - 'trap' (Snare)
      - 'moss' (Bedding)
    `;

    let summary: string | null = null;
    let processedHistory = [...history];

    if (processedHistory.length > HISTORY_THRESHOLD) {
        console.log("History threshold exceeded. Generating summary...");
        const oldHistory = processedHistory.slice(0, -RECENT_HISTORY_COUNT);
        const recentHistory = processedHistory.slice(-RECENT_HISTORY_COUNT);
        
        summary = await summarizeHistory(oldHistory);
        processedHistory = recentHistory;
    }

    const contents = processedHistory
        .filter(m => m.role !== 'system' && m.role !== 'error' && m.text.trim() !== '')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: `(${m.author}): ${m.text}` }]
        }));

    if (summary) {
        contents.unshift({
            role: 'model',
            parts: [{ text: `--- STORY RECAP ---\n${summary}\n--- END RECAP ---` }]
        });
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
    
    try {
        const result = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: contents,
          config: {
            systemInstruction: systemInstructionText,
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
            ],
            maxOutputTokens: 1000, // Increased for cinematic description
            temperature: 0.9,
          }
        });

        const aiText = result.text;
        const candidate = result.candidates?.[0];

        if (!aiText) {
            if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                throw new Error(`The spirits blocked this action (${candidate.finishReason}).`);
            }
            throw new Error('The spirits are silent.');
        }

        const lines = aiText.split('\n');
        const narrativeLines: string[] = [];
        const suggestionLines: string[] = [];
        const commandLines: string[] = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('[[') && trimmed.endsWith(']]')) {
                commandLines.push(trimmed);
            } else if (trimmed.startsWith('-')) {
                suggestionLines.push(trimmed.substring(1).trim());
            } else {
                narrativeLines.push(line);
            }
        });

        const narrative = narrativeLines.join('\n').trim();

        return {
          narrative,
          suggestions: suggestionLines,
          commands: commandLines
        };

    } catch (error) {
        throw error;
    }
};
