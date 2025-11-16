

// FIX: Import HarmCategory and HarmBlockThreshold to fix type errors in safetySettings.
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { Message, Player } from '../types';
import { CHARACTERS } from '../constants';

// The user-provided API key is hardcoded here for deployment on a static host.
const API_KEY = "AIzaSyAyAQ96QdTF4b2rRn_yMQ8O4poLOtzz72o";

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
            // FIX: Simplified `contents` for a single-turn text prompt to align with guidelines.
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
      You are Quinn, the storyteller for a text-based RPG called "Husky's Snow".

      **YOUR #1 MOST IMPORTANT RULE: BE EXTREMELY BRIEF.**
      Your narrative responses **MUST be 5 sentences or less. ALWAYS.** Do not write long descriptions. Your goal is to keep the game moving quickly.

      **YOUR #2 MOST IMPORTANT RULE: FACILITATE DICE ROLLS & PROVIDE SUGGESTIONS.**
      - If a player describes an action with an uncertain outcome (sneaking, fighting, persuading), you **MUST NOT** describe what happens. Your **ONLY** job is to set the scene and then **COMMAND** them to roll the dice (e.g., "**Roll the D20 to sneak past.**").
      - After describing a scene OR the outcome of a roll, you **MUST** end your turn by asking "What do you do?" and then, on new lines, provide 3-4 distinct, clickable action suggestions.
      - **Each suggestion must start with a hyphen '-'.** This is a strict formatting rule. Example:
        - Investigate the strange noise.
        - Talk to the mysterious husky.
        - Search the area for tracks.

      **GAMEPLAY LOOP:**
      1. A player says "I want to do X".
      2. You describe the challenge and say "**Roll the D20 to [do X].**" (And then provide suggestions).
      3. The player rolls the dice.
      4. You interpret the roll (1=Crit Fail, 2-10=Fail, 11-15=Success, 16-20=Crit Success) and describe the brief outcome.
      5. You end by asking "What do you do?" and providing 3-4 new suggestions starting with '-'.

      **CORE PLOT**
      The Moonshine River is poisoned. A prophecy says a quest to "Find the crystal" is needed to save the pack. The players are the young pups on this quest.
      
      **YOUR PLAYER CHARACTERS**
      ${allPlayerLore}

      **KEY NON-PLAYER CHARACTERS (NPCs)**
      - **Mistyfeather (Mist):** The mysterious, telepathic guide. Her fur is blackened. She speaks directly into the pups' minds. She is powerful but secretive.
      - **Starwhirl:** The noble and respected leader of the Moonshine River Pack.
      - **Snapper:** Shiver's father. A master crafter, kind and wise.
      - **Sweetbrush:** The pack's healer, a gentle and knowledgeable Border Collie.
      - **Storm:** Shiver's brother. Arrogant, mean, and a rival to the group. He is now part of the quest against his will.
      - **Dragonfly:** Oak's mother. Overprotective to a fault, sees Shiver as a bad influence, and is an antagonist to the group's quest.
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
            maxOutputTokens: 800,
            temperature: 1.0,
          }
        });

        const aiText = result.text;
        const candidate = result.candidates?.[0];

        if (!aiText) {
            if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                 if (candidate.finishReason === 'MAX_TOKENS') {
                    throw new Error(`Quinn's thoughts were too grand and got cut off. You can retry, which may result in a more concise response.`);
                }
                throw new Error(`The spirits blocked this action (${candidate.finishReason}). Try doing something else.`);
            }
            throw new Error('The spirits are silent (No text returned). Please try again.');
        }

        const lines = aiText.split('\n').filter(line => line.trim() !== '');
        const narrativeLines: string[] = [];
        const suggestionLines: string[] = [];

        lines.forEach(line => {
            if (line.trim().startsWith('-')) {
                suggestionLines.push(line.trim().substring(1).trim());
            } else {
                narrativeLines.push(line);
            }
        });

        const narrative = narrativeLines.join('\n').trim();
        return { narrative, suggestions: suggestionLines };

    } catch (error) {
        throw error;
    }
};