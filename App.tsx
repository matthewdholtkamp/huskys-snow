import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { auth, db, getGameCollectionPath, getGameDocPath, getMessagesColPath } from './services/firebaseService';
import { generateAIResponse } from './services/geminiService';
import { CHARACTERS, ITEMS_REGISTRY, BADGES_REGISTRY } from './src/constants';
import type { GameState, Character, Player, Message, GameSession } from './src/types';
import { getNextChapter } from './src/game/chapters';
import { ABILITIES } from './src/game/magic';
import { audioService } from './services/audioService';

import IntroScreen from './components/IntroScreen';
import LobbyScreen from './components/LobbyScreen';
import CharacterSelectionScreen from './components/CharacterSelectionScreen';
import GameScreen from './src/components/GameScreen';

const GAME_ID_KEY = 'husky-snow-gameId';
const STORAGE_MODE_KEY = 'husky-snow-storageMode';
const LOCAL_GAME_PREFIX = 'husky-snow-local-game:';

type StorageMode = 'firestore' | 'local';

type LocalGameRecord = {
  gameData: GameSession;
  messages: Message[];
  suggestions: string[];
};

type GameDebugWindow = Window & {
  render_game_to_text?: () => string;
};

const getLocalGameKey = (id: string) => `${LOCAL_GAME_PREFIX}${id}`;

const readLocalGame = (id: string): LocalGameRecord | null => {
  const raw = localStorage.getItem(getLocalGameKey(id));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalGameRecord;
  } catch (e) {
    console.error('Failed to read local game record:', e);
    return null;
  }
};

const writeLocalGame = (id: string, record: LocalGameRecord) => {
  localStorage.setItem(getLocalGameKey(id), JSON.stringify(record));
};

const createLocalGameId = () => `local-${crypto.randomUUID()}`;

const uniqueIds = (ids: string[]) => Array.from(new Set(ids.filter(Boolean)));

const timestampToMillis = (value: Message['timestamp'] | GameSession['lastActiveAt']) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();

  const serializedTimestamp = value as unknown as { seconds?: number; nanoseconds?: number };
  if (typeof serializedTimestamp.seconds === 'number') {
    return (serializedTimestamp.seconds * 1000) + Math.floor((serializedTimestamp.nanoseconds || 0) / 1_000_000);
  }

  return 0;
};

const sortMessages = (items: Message[]) => {
  return [...items].sort((a, b) => {
    const aMs = timestampToMillis(a.timestamp);
    const bMs = timestampToMillis(b.timestamp);
    return aMs - bMs;
  });
};

const STARTING_NARRATIVE = `🌲 **WELCOME TO THE MOONSHINE RIVER PACK** 🌲

The Moonshine River has always been the lifeblood of our pack. But lately, a dark, oily rot has taken hold, poisoning the waters and crying out in the minds of the forest spirits. Seven quest pups have been chosen to venture into the frozen peaks, find the legendary Frost Crystal, and ignite it to decide the fate of our home.

You stand at the edge of the Faststream Forest. The river murmurs sick and black beside you. A dry, telepathic voice echoes in your mind: *'Finally awake, little stars? The frost rot is spreading. We must act.'* It is Mist, your telepathic guide.

**What do you do?**`;

const STARTING_SUGGESTIONS: Record<string, string[]> = {
  'Shiver': ['Inspect the oily water', 'Ask Mist what she senses', 'Study the tree roots'],
  'Oak': ['Look for tracks on the bank', 'Check the snare near the brush', 'Listen to the wind'],
  'Glacier': ['Test the river current with a paw', 'Scan the ridge for threats', 'Stand alert and ready'],
  'Flurry': ['Search for healing berries', 'Examine the sick plants', 'Calm your breathing'],
  'Spruce': ['Scout ahead along the trail', 'Tell a quick joke to defuse tension', 'Climb a tree to look around'],
  'Storm': ['Shove a rotten log aside', 'Growl at the dark shadows', 'Brag about your claws']
};

const resolvePlayerIndex = (targetName: string, players: Player[]): number => {
  const cleaned = targetName.trim().toLowerCase();
  let nameToFind = cleaned;
  if (cleaned === 'flurree') nameToFind = 'flurry';
  if (cleaned === 'mist' || cleaned === 'misty') nameToFind = 'mistyfeather';
  return players.findIndex(p => p.charName.toLowerCase() === nameToFind);
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [gameId, setGameId] = useState<string | null>(() => localStorage.getItem(GAME_ID_KEY));
  const [storageMode, setStorageMode] = useState<StorageMode>(() => {
    const storedMode = localStorage.getItem(STORAGE_MODE_KEY);
    const storedGameId = localStorage.getItem(GAME_ID_KEY);
    return storedMode === 'local' || storedGameId?.startsWith('local-') ? 'local' : 'firestore';
  });
  const [localVersion, setLocalVersion] = useState(0);
  const [gameData, setGameData] = useState<GameSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [gameState]);
  
  // --- Auth Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          setUser(userCredential.user);
        } catch (e) {
          console.error("Anonymous sign-in failed", e);
          setError("Failed to connect to the game service. Please refresh.");
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Game and Message Subscription Effect ---
  useEffect(() => {
    if (!gameId || !db || storageMode === 'local') return;

    const gameDocRef = doc(db, getGameDocPath(gameId));
    const gameUnsubscribe = onSnapshot(gameDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameSession;
        setGameData({ ...data, id: docSnap.id });
        setGameState((state) => state === 'intro' ? state : 'playing');
      } else {
        setError("The game session you were in seems to have ended.");
        handleLeaveGame();
      }
    }, (err) => {
      console.error("Error subscribing to game data:", err);
      setError("Lost connection to the game session.");
      handleLeaveGame();
    });

    const messagesColRef = collection(db, getMessagesColPath(gameId));
    const messagesQuery = query(messagesColRef, orderBy('timestamp', 'asc'));
    const messagesUnsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(sortMessages(msgs));
    });

    return () => {
      gameUnsubscribe();
      messagesUnsubscribe();
    };
  }, [gameId, storageMode]);

  // --- Local Fallback Game Sync Effect ---
  useEffect(() => {
    if (storageMode !== 'local' || !gameId) return;

    const syncLocalGame = () => {
      const record = readLocalGame(gameId);
      if (!record) {
        setError("The local game session could not be found.");
        handleLeaveGame();
        return;
      }

      setGameData(record.gameData);
      setMessages(sortMessages(record.messages || []));
      setSuggestions(record.suggestions || []);
      const nextState = record.gameData.players.some((p) => p.userId === user?.uid) ? 'playing' : 'selection';
      setGameState((state) => state === 'intro' ? state : nextState);
    };

    syncLocalGame();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === getLocalGameKey(gameId)) {
        syncLocalGame();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageMode, gameId, user?.uid, localVersion]);


  // FIX: Explicitly typed the useMemo return value to prevent `playerRole` from being widened to `string`.
  const { selectedChar, playerRole } = useMemo((): { selectedChar: Character | null; playerRole: 'host' | 'player' | 'spectator' } => {
    if (!user || !gameData) return { selectedChar: null, playerRole: 'spectator' };
    const player = gameData.players.find(p => p.userId === user.uid);
    const char = CHARACTERS.find(c => c.name === player?.charName) || null;
    const role: 'host' | 'player' | 'spectator' = player ? (gameData.hostId === user.uid ? 'host' : 'player') : 'spectator';
    return { selectedChar: char, playerRole: role };
  }, [user, gameData]);

  useEffect(() => {
    const debugWindow = window as GameDebugWindow;
    debugWindow.render_game_to_text = () => {
      const activePlayerName = gameData?.turnOrder?.[gameData.currentTurnIndex ?? 0] ?? null;
      const currentPlayer = selectedChar
        ? gameData?.players.find((player) => player.charName === selectedChar.name)
        : null;

      return JSON.stringify({
        screen: gameState,
        coordinateSystem: 'DOM interface; no world-space movement controls',
        gameId,
        player: selectedChar ? {
          name: selectedChar.name,
          role: playerRole,
          hp: currentPlayer?.hp ?? 100,
          rank: currentPlayer?.rank ?? 'Pup',
        } : null,
        session: gameData ? {
          chapterId: gameData.chapterId,
          objective: gameData.objective,
          scene: gameData.scene,
          phase: gameData.phase ?? 'initiative',
          activePlayerName,
          turnOrder: gameData.turnOrder ?? [],
          packHeart: gameData.packHeart ?? 100,
          players: gameData.players.map((player) => ({
            name: player.charName || 'Choosing',
            hp: player.hp,
            initiative: player.initiativeRoll ?? null,
          })),
        } : null,
        recentMessages: messages.slice(-3).map((message) => ({
          role: message.role,
          author: message.author ?? null,
          text: message.text,
          isRoll: message.isRoll ?? false,
        })),
        suggestedActions: suggestions,
        isThinking,
      });
    };

    return () => {
      delete debugWindow.render_game_to_text;
    };
  }, [gameState, gameId, gameData, isThinking, messages, playerRole, selectedChar, suggestions]);


  // --- AI Trigger Effect (Host-only) ---
  useEffect(() => {
    if (playerRole !== 'host' || isThinking || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    const isInitiativeRoll = lastMessage.isRoll === true
      && lastMessage.rollOutcome?.startsWith('Initiative:');

    if (lastMessage.role === 'user' && !isInitiativeRoll) {
      // FIX: Replace findLastIndex with a compatible for loop for broader browser support.
      let lastUserMessageIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserMessageIndex = i;
          break;
        }
      }
      if (lastUserMessageIndex === -1) return;

      const modelHasResponded = messages.slice(lastUserMessageIndex + 1).some(m => m.role === 'model' || m.role === 'error');
      if (!modelHasResponded) {
        handleTriggerAIResponse(messages, lastMessage.text);
      }
    }
  }, [messages, isThinking, playerRole]);

  const addMessageToDb = useCallback(async (
    role: Message['role'],
    text: string,
    isRoll = false,
    rollOutcome?: string,
    rollStat?: 'strength' | 'agility' | 'smart' | 'spirit',
    rollRaw?: number,
    rollModifier?: number,
    rollTotal?: number
  ) => {
    if (!gameId || !user) return;
    const authorName = role === 'model' ? 'Quinn' : role === 'system' ? 'System' : (selectedChar?.name || 'Player');
    const baseMessage = {
      role,
      text,
      author: authorName,
      userId: user.uid,
      isRoll,
      ...(rollOutcome ? { rollOutcome } : {}),
      ...(rollStat ? { rollStat } : {}),
      ...(rollRaw !== undefined ? { rollRaw } : {}),
      ...(rollModifier !== undefined ? { rollModifier } : {}),
      ...(rollTotal !== undefined ? { rollTotal } : {}),
    };

    if (storageMode === 'local') {
      const record = readLocalGame(gameId);
      if (!record) return;

      const localMessage: Message = {
        id: crypto.randomUUID(),
        ...baseMessage,
        timestamp: Timestamp.now(),
      };
      record.messages = sortMessages([...(record.messages || []), localMessage]);
      record.gameData = { ...record.gameData, lastActiveAt: Timestamp.now() };
      writeLocalGame(gameId, record);
      setMessages(record.messages);
      setLocalVersion((version) => version + 1);
      return;
    }

    await addDoc(collection(db, getMessagesColPath(gameId)), {
      ...baseMessage,
      timestamp: serverTimestamp(),
    });
    await updateDoc(doc(db, getGameDocPath(gameId)), {
      lastActiveAt: serverTimestamp(),
    });
  }, [gameId, user, selectedChar, storageMode]);

  const handleProcessCommands = useCallback(async (commands: string[]) => {
      if (!gameId || !gameData) return;

      const updatedPlayers = [...gameData.players];
      let sessionUpdates: Partial<GameSession> = {};
      let hasUpdates = false;

      for (const cmd of commands) {
          // Parse command: [[ADD_ITEM: Shiver | berry]]
          const content = cmd.replace('[[', '').replace(']]', '');
          const parts = content.split(':');
          const action = parts[0].trim();
          const args = parts[1] ? parts[1].split('|').map(s => s.trim()) : [];

          if (action === 'ADD_ITEM' && args.length === 2) {
             const [targetName, itemId] = args;
             const itemDef = ITEMS_REGISTRY[itemId];
             const playerIdx = resolvePlayerIndex(targetName, updatedPlayers);

             if (itemDef && playerIdx !== -1) {
                const player = { ...updatedPlayers[playerIdx] };
                const inventory = player.inventory ? [...player.inventory] : [];
                const existingItem = inventory.find(i => i.id === itemId);

                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    inventory.push({ ...itemDef, id: itemId, quantity: 1 });
                }
                player.inventory = inventory;
                updatedPlayers[playerIdx] = player;
                hasUpdates = true;
                // Notify via system message
                await addMessageToDb('system', `${player.charName} received ${itemDef.name}.`);
             }
          }

          if (action === 'AWARD_BADGE' && args.length === 2) {
               const [targetName, badgeId] = args;
               const badgeDef = BADGES_REGISTRY[badgeId];
               const playerIdx = resolvePlayerIndex(targetName, updatedPlayers);

               if (badgeDef && playerIdx !== -1) {
                   const player = { ...updatedPlayers[playerIdx] };
                   const badges = player.badges ? [...player.badges] : [];
                   if (!badges.find(b => b.id === badgeId)) {
                       badges.push({ ...badgeDef, id: badgeId, earnedAt: Timestamp.now() });

                       const currentXp = player.xp ?? 0;
                       const newXp = currentXp + 100;
                       let rank = 'Pup';
                       if (newXp >= 300) rank = 'Pack Hero';
                       else if (newXp >= 150) rank = 'Apprentice';
                       else if (newXp >= 50) rank = 'Trainee';
                       
                       player.xp = newXp;
                       player.rank = rank;
                       player.badges = badges;
                       updatedPlayers[playerIdx] = player;
                       hasUpdates = true;
                       await addMessageToDb('system', `✨ BADGE EARNED: ${player.charName} - ${badgeDef.name} (+100 XP) ✨`);
                   }
               }
          }

          if (action === 'DAMAGE' && args.length === 2) {
             const [targetName, amountStr] = args;
             const amount = parseInt(amountStr, 10);
             const playerIdx = resolvePlayerIndex(targetName, updatedPlayers);

             if (!isNaN(amount) && playerIdx !== -1) {
                const player = { ...updatedPlayers[playerIdx] };
                const oldHp = player.hp ?? 100;
                player.hp = Math.max(0, oldHp - amount);
                updatedPlayers[playerIdx] = player;
                hasUpdates = true;
                
                await addMessageToDb('system', `💥 ${player.charName} took ${amount} damage! (HP: ${player.hp}/${player.maxHp})`);
                if (player.hp === 0) {
                    await addMessageToDb('system', `⚠️ ${player.charName} has been downed! They cannot act until revived by a packmate.`);
                }
             }
          }

          if (action === 'HEAL' && args.length === 2) {
             const [targetName, amountStr] = args;
             const amount = parseInt(amountStr, 10);
             const playerIdx = resolvePlayerIndex(targetName, updatedPlayers);

             if (!isNaN(amount) && playerIdx !== -1) {
                const player = { ...updatedPlayers[playerIdx] };
                const oldHp = player.hp ?? 100;
                player.hp = Math.min(player.maxHp || 100, oldHp + amount);
                updatedPlayers[playerIdx] = player;
                hasUpdates = true;
                
                await addMessageToDb('system', `💚 ${player.charName} was healed for ${amount} HP! (HP: ${player.hp}/${player.maxHp})`);
             }
          }

          if (action === 'COMPLETE_OBJECTIVE' && args.length === 1) {
             const compChapterId = args[0];
             const nextChap = getNextChapter(compChapterId);

             // Award 50 XP to all active players
             updatedPlayers.forEach(p => {
               const currentXp = p.xp ?? 0;
               const newXp = currentXp + 50;
               let rank = 'Pup';
               if (newXp >= 300) rank = 'Pack Hero';
               else if (newXp >= 150) rank = 'Apprentice';
               else if (newXp >= 50) rank = 'Trainee';
               p.xp = newXp;
               p.rank = rank;
             });

             if (nextChap) {
                sessionUpdates.chapterId = nextChap.id;
                sessionUpdates.objective = nextChap.objective;
                sessionUpdates.scene = nextChap.sceneHint;
                hasUpdates = true;
                await addMessageToDb('system', `✦ Objective Met! Chapter complete. Starting ${nextChap.title}. (+50 XP for the pack) Objective: ${nextChap.objective}`);
             } else {
                sessionUpdates.status = 'ended';
                hasUpdates = true;
                await addMessageToDb('system', `👑 VICTORY! The Moonshine River Pack has restored the Frost Crystal and saved their home! (+50 XP for the pack)`);
             }
          }

          if (action === 'SCENE' && args.length === 1) {
             const newScene = args[0];
             sessionUpdates.scene = newScene;
             hasUpdates = true;
             await addMessageToDb('system', `🗺️ The scene shifts to: ${newScene.toUpperCase()}`);
          }

          if (action === 'HEART' && args.length === 3) {
             const [amountStr, value, reason] = args;
             const amount = parseInt(amountStr.replace('+', ''), 10);
             if (!isNaN(amount)) {
                const currentHeart = gameData.packHeart ?? 100;
                sessionUpdates.packHeart = Math.min(100, Math.max(0, currentHeart + amount));
                hasUpdates = true;
                await addMessageToDb('system', `💖 PACK HEART (+${amount}): The pack showed ${value.toUpperCase()}! Reason: ${reason}`);
             }
          }
      }

      if (hasUpdates) {
          if (storageMode === 'local') {
              const record = readLocalGame(gameId);
              if (!record) return;
              record.gameData = { 
                ...record.gameData, 
                players: updatedPlayers, 
                ...sessionUpdates,
                lastActiveAt: Timestamp.now() 
              };
              writeLocalGame(gameId, record);
              setGameData(record.gameData);
              setLocalVersion((version) => version + 1);
              return;
          }

          const gameDocRef = doc(db, getGameDocPath(gameId));
          await updateDoc(gameDocRef, { 
            players: updatedPlayers, 
            ...sessionUpdates,
            lastActiveAt: serverTimestamp() 
          });
      }

  }, [gameId, gameData, addMessageToDb, storageMode]);

  const handleSpendPackHeart = useCallback(async (amount: number, reason: string) => {
    if (!gameId || !gameData) return;
    const currentHeart = gameData.packHeart ?? 100;
    const newHeart = Math.max(0, currentHeart - amount);
    
    const updateData = {
      packHeart: newHeart,
      lastActiveAt: storageMode === 'local' ? Timestamp.now() : serverTimestamp() as any
    };

    if (storageMode === 'local') {
      const record = readLocalGame(gameId);
      if (record) {
        record.gameData = { ...record.gameData, ...updateData };
        writeLocalGame(gameId, record);
        setGameData(record.gameData);
        setLocalVersion(v => v + 1);
      }
    } else {
      const gameDocRef = doc(db, getGameDocPath(gameId));
      await updateDoc(gameDocRef, updateData);
    }
    await addMessageToDb('system', `💔 PACK HEART (-${amount}): Spent Pack Heart for ${reason}. (Remaining: ${newHeart}/100)`);
  }, [gameId, gameData, storageMode, addMessageToDb]);

  const handleTriggerAIResponse = useCallback(async (
    history: Message[],
    prompt: string,
    playersOverride?: Player[]
  ) => {
    const activePlayers = playersOverride || gameData?.players;
    if (!activePlayers || activePlayers.length === 0) return;
    setIsThinking(true);
    setSuggestions([]);
    setLastPrompt(prompt);
    
    try {
      const { narrative, suggestions: newSuggestions, commands, suggestionsByPup: newSuggestionsByPup } = await generateAIResponse(
        history,
        prompt,
        gameData,
        playersOverride
      );
      await addMessageToDb('model', narrative);
      setSuggestions(newSuggestions);

      if (gameId) {
        if (storageMode === 'local') {
          const record = readLocalGame(gameId);
          if (record) {
            record.suggestions = newSuggestions;
            record.gameData.suggestionsByPup = newSuggestionsByPup || {};
            writeLocalGame(gameId, record);
            setGameData(record.gameData);
            setLocalVersion((version) => version + 1);
          }
        } else {
          const gameDocRef = doc(db, getGameDocPath(gameId));
          await updateDoc(gameDocRef, {
            suggestionsByPup: newSuggestionsByPup || {},
            lastActiveAt: serverTimestamp()
          });
        }
      }

      if (commands && commands.length > 0) {
          await handleProcessCommands(commands);
      }

      // Advance turn index if we are in turn-based play mode
      if (gameId) {
        let currentOrder: string[] | undefined = undefined;
        let currentIndex: number | undefined = undefined;
        let currentPlayers: Player[] = [];

        if (storageMode === 'local') {
          const record = readLocalGame(gameId);
          if (record) {
            currentOrder = record.gameData.turnOrder;
            currentIndex = record.gameData.currentTurnIndex;
            currentPlayers = record.gameData.players;
          }
        } else {
          const gameDocRef = doc(db, getGameDocPath(gameId));
          const snap = await getDoc(gameDocRef);
          if (snap.exists()) {
            const data = snap.data() as GameSession;
            currentOrder = data.turnOrder;
            currentIndex = data.currentTurnIndex;
            currentPlayers = data.players || [];
          }
        }

        if (currentOrder && currentOrder.length > 1 && currentIndex !== undefined) {
          let nextIndex = currentIndex;
          let skippedPlayers: string[] = [];

          for (let i = 0; i < currentOrder.length; i++) {
            nextIndex = (nextIndex + 1) % currentOrder.length;
            const nextPlayerName = currentOrder[nextIndex];
            const player = currentPlayers.find(p => p.charName === nextPlayerName);
            if (player && player.hp > 0) {
              break;
            } else if (player) {
              skippedPlayers.push(nextPlayerName);
            }
          }

          const updateData = {
            currentTurnIndex: nextIndex
          };

          if (storageMode === 'local') {
            const record = readLocalGame(gameId);
            if (record) {
              record.gameData = { ...record.gameData, ...updateData, lastActiveAt: Timestamp.now() };
              writeLocalGame(gameId, record);
              setGameData(record.gameData);
              setLocalVersion((version) => version + 1);
            }
          } else {
            const gameDocRef = doc(db, getGameDocPath(gameId));
            await updateDoc(gameDocRef, { ...updateData, lastActiveAt: serverTimestamp() });
          }

          for (const skipped of skippedPlayers) {
            await addMessageToDb('system', `⏭️ ${skipped} is downed — skipping their turn.`);
          }
        }
      }

    } catch (err: unknown) {
      console.error("AI Response Error:", err);
      const message = err instanceof Error ? err.message : "Connection lost.";
      const friendlyMessage = /quota|429|resource_exhausted/i.test(message)
        ? "You've reached the daily request limit for the AI service. The story must pause until more quota is available."
        : message;
      await addMessageToDb('error', `⚠️ ${friendlyMessage}`);
    } finally {
      setIsThinking(false);
    }
  }, [gameData, addMessageToDb, handleProcessCommands, storageMode, gameId]);

  // --- Initiative Rolling Logic ---
  const handleInitiativeRoll = async (result: number) => {
    if (!user || !gameId || !gameData) return;

    if (storageMode === 'local') {
      const record = readLocalGame(gameId);
      if (record) {
        const updatedPlayers = record.gameData.players.map(p => {
          if (p.userId === user.uid) {
            return { ...p, initiativeRoll: result };
          }
          return p;
        });
        record.gameData = { ...record.gameData, players: updatedPlayers, lastActiveAt: Timestamp.now() };
        writeLocalGame(gameId, record);
        setGameData(record.gameData);
        setLocalVersion((version) => version + 1);
      }
    } else {
      const gameDocRef = doc(db, getGameDocPath(gameId));
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(gameDocRef);
        if (!snap.exists()) throw new Error("Game session not found");
        const currentData = snap.data() as GameSession;
        const nextPlayers = currentData.players.map(p => {
          if (p.userId === user.uid) {
            return { ...p, initiativeRoll: result };
          }
          return p;
        });
        transaction.update(gameDocRef, {
          players: nextPlayers,
          lastActiveAt: serverTimestamp()
        });
      });
    }

    const myPlayer = gameData.players.find(p => p.userId === user.uid);
    const charName = myPlayer?.charName || 'Player';
    await addMessageToDb('user', `*rolls initiative: ${result}*`, true, `Initiative: ${result}`, undefined, result, 0, result);
  };

  // --- Host Initiative & Turn Order Processing Effect ---
  useEffect(() => {
    if (playerRole !== 'host' || !gameId || !gameData) return;

    const { players = [], phase = 'initiative', turnOrder = [], currentTurnIndex = 0 } = gameData;
    if (players.length === 0) return;

    if (phase === 'initiative') {
      if (players.length === 1) {
        // Single-player bypass: auto-resolve initiative phase immediately
        const soloPlayer = players[0];
        const playersWithInitiative = players.map((player) => (
          player.userId === soloPlayer.userId
            ? { ...player, initiativeRoll: player.initiativeRoll ?? 10 }
            : player
        ));
        const updateData = {
          players: playersWithInitiative,
          phase: 'playing' as const,
          turnOrder: [soloPlayer.charName],
          currentTurnIndex: 0,
          suggestionsByPup: STARTING_SUGGESTIONS,
        };

        const updateGameDb = async () => {
          if (storageMode === 'local') {
            const record = readLocalGame(gameId);
            if (record) {
              record.gameData = { ...record.gameData, ...updateData, lastActiveAt: Timestamp.now() };
              writeLocalGame(gameId, record);
              setGameData(record.gameData);
              setLocalVersion(v => v + 1);
            }
          } else {
            const gameDocRef = doc(db, getGameDocPath(gameId));
            await updateDoc(gameDocRef, { ...updateData, lastActiveAt: serverTimestamp() });
          }

          if (!messages.some(m => m.role === 'model')) {
            await addMessageToDb('model', STARTING_NARRATIVE);
          }
        };

        updateGameDb().catch(err => console.error("Failed to bypass initiative for solo player:", err));
        return;
      }

      // Check if all players have rolled
      const allRolled = players.every(p => p.initiativeRoll !== undefined);
      if (allRolled) {
        // Sort players by initiativeRoll descending
        const sorted = [...players].sort((a, b) => {
          if (b.initiativeRoll! === a.initiativeRoll!) {
            return a.charName.localeCompare(b.charName);
          }
          return b.initiativeRoll! - a.initiativeRoll!;
        });
        const order = sorted.map(p => p.charName);

        const updateData = {
          phase: 'playing' as const,
          turnOrder: order,
          currentTurnIndex: 0,
          suggestionsByPup: STARTING_SUGGESTIONS,
        };

        const updateGameDb = async () => {
          if (storageMode === 'local') {
            const record = readLocalGame(gameId);
            if (record) {
              record.gameData = { ...record.gameData, ...updateData, lastActiveAt: Timestamp.now() };
              writeLocalGame(gameId, record);
              setGameData(record.gameData);
              setLocalVersion(v => v + 1);
            }
          } else {
            const gameDocRef = doc(db, getGameDocPath(gameId));
            await updateDoc(gameDocRef, { ...updateData, lastActiveAt: serverTimestamp() });
          }

          if (!messages.some(m => m.role === 'model')) {
            await addMessageToDb('model', STARTING_NARRATIVE);
          }
        };

        updateGameDb().catch(err => console.error("Failed to complete initiative phase:", err));
      }
    } else if (phase === 'playing') {
      // Check for late joiners who have rolled but are not in turnOrder
      const lateJoiners = players.filter(p => p.initiativeRoll !== undefined && !turnOrder.includes(p.charName));
      if (lateJoiners.length > 0) {
        // Save current active character name so we don't change their turn
        const activeCharName = turnOrder[currentTurnIndex];

        // Preserve established combatants while inserting rolled late joiners.
        // Older solo sessions may not have stored an initiative result, so
        // treat their established turn-order position as a neutral roll of 10.
        const rankedPlayers = players.filter(
          p => p.initiativeRoll !== undefined || turnOrder.includes(p.charName)
        );
        const sorted = [...rankedPlayers].sort((a, b) => {
          const aInitiative = a.initiativeRoll ?? 10;
          const bInitiative = b.initiativeRoll ?? 10;
          if (bInitiative === aInitiative) {
            return a.charName.localeCompare(b.charName);
          }
          return bInitiative - aInitiative;
        });
        const order = sorted.map(p => p.charName);

        // Find the new index of the active player
        let nextTurnIndex = 0;
        if (activeCharName) {
          nextTurnIndex = order.indexOf(activeCharName);
          if (nextTurnIndex === -1) nextTurnIndex = 0;
        }

        const updateData = {
          turnOrder: order,
          currentTurnIndex: nextTurnIndex
        };

        const updateGameDb = async () => {
          if (storageMode === 'local') {
            const record = readLocalGame(gameId);
            if (record) {
              record.gameData = { ...record.gameData, ...updateData, lastActiveAt: Timestamp.now() };
              writeLocalGame(gameId, record);
              setGameData(record.gameData);
              setLocalVersion(v => v + 1);
            }
          } else {
            const gameDocRef = doc(db, getGameDocPath(gameId));
            await updateDoc(gameDocRef, { ...updateData, lastActiveAt: serverTimestamp() });
          }
          await addMessageToDb('system', `Turn order updated: ${order.join(' → ')}`);
        };

        updateGameDb().catch(err => console.error("Failed to integrate late joiner turn order:", err));
      }
    }
  }, [playerRole, gameId, gameData, storageMode, messages.length, handleTriggerAIResponse, addMessageToDb]);

  // --- Game Flow Functions ---
  const handleCreateGame = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const newGame: Omit<GameSession, 'id'> = {
        hostId: user.uid,
        players: [],
        playerIds: [user.uid],
        createdAt: serverTimestamp() as Timestamp,
        lastActiveAt: serverTimestamp() as Timestamp,
        status: 'active',
        inventory: {}, // Initialize empty
        badges: {},    // Initialize empty
        chapterId: 'chapter_1',
        objective: 'Investigate the Moonshine River and find out what is making the water sick.',
        scene: 'river',
        packWarmth: 100,
        phase: 'initiative',
        packHeart: 100,
        suggestionsByPup: {}
      };
      const gameCollection = collection(db, getGameCollectionPath());
      const docRef = await addDoc(gameCollection, newGame);
      localStorage.setItem(GAME_ID_KEY, docRef.id);
      localStorage.setItem(STORAGE_MODE_KEY, 'firestore');
      setStorageMode('firestore');
      setGameId(docRef.id);
      setGameState('selection');
    } catch (err) {
      console.warn("Firestore create failed; using local browser game mode.", err);
      const localGameId = createLocalGameId();
      const localGameData: GameSession = {
        id: localGameId,
        hostId: user.uid,
        players: [],
        playerIds: [user.uid],
        createdAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        status: 'active',
        inventory: {},
        badges: {},
        chapterId: 'chapter_1',
        objective: 'Investigate the Moonshine River and find out what is making the water sick.',
        scene: 'river',
        packWarmth: 100,
        phase: 'initiative',
        packHeart: 100,
        suggestionsByPup: {}
      };
      writeLocalGame(localGameId, {
        gameData: localGameData,
        messages: [],
        suggestions: []
      });
      localStorage.setItem(GAME_ID_KEY, localGameId);
      localStorage.setItem(STORAGE_MODE_KEY, 'local');
      setStorageMode('local');
      setGameId(localGameId);
      setGameData(localGameData);
      setMessages([]);
      setSuggestions([]);
      setGameState('selection');
      setLocalVersion((version) => version + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (idToJoin: string) => {
    const targetId = idToJoin.trim();
    if (!targetId) {
        setError("Please enter a Game ID.");
        return;
    }
    setIsLoading(true);
    setError(null);

    const localRecord = readLocalGame(targetId);
    if (localRecord) {
        localStorage.setItem(GAME_ID_KEY, targetId);
        localStorage.setItem(STORAGE_MODE_KEY, 'local');
        setStorageMode('local');
        setGameId(targetId);
        setGameData(localRecord.gameData);
        setMessages(sortMessages(localRecord.messages || []));
        setSuggestions(localRecord.suggestions || []);
        setGameState('selection');
        setLocalVersion((version) => version + 1);
        setIsLoading(false);
        return;
    }

    try {
        const gameDocRef = doc(db, getGameDocPath(targetId));
        const docSnap = await getDoc(gameDocRef);
        if (docSnap.exists()) {
            localStorage.setItem(GAME_ID_KEY, targetId);
            localStorage.setItem(STORAGE_MODE_KEY, 'firestore');
            setStorageMode('firestore');
            setGameId(targetId);
            setGameState('selection');
        } else {
            setError("Game not found. Please check the ID and try again.");
        }
    } catch (err) {
        console.error("Failed to join game", err);
        setError("An error occurred while trying to join the game.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSelectChar = async (char: Character) => {
    if (!user || !gameId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Initialize player with badges from character default if any (e.g. Oak's fish badge)
      const starterBadges = [];
      if (char.visuals.badgeSlots.small) starterBadges.push(char.visuals.badgeSlots.small);

      const player: Player = {
          userId: user.uid,
          charName: char.name,
          hp: 100,
          maxHp: 100,
          xp: 0,
          rank: 'Pup',
          inventory: [],
          badges: starterBadges
      };

      if (storageMode === 'local') {
        const record = readLocalGame(gameId);
        if (!record) {
          setError("The local game session could not be found.");
          return;
        }

        const wasFirstPlayer = record.gameData.players.length === 0;
        const takenBySomeoneElse = record.gameData.players.some((p) => p.charName === char.name && p.userId !== user.uid);
        if (takenBySomeoneElse) {
          setError(`${char.name} is already taken in this game.`);
          return;
        }
        const playersWithoutCurrentUser = record.gameData.players.filter((p) => p.userId !== user.uid);
        const updatedPlayers = [...playersWithoutCurrentUser, player];
        record.gameData = {
          ...record.gameData,
          players: updatedPlayers,
          playerIds: uniqueIds([...(record.gameData.playerIds || []), user.uid]),
          lastActiveAt: Timestamp.now(),
        };
        writeLocalGame(gameId, record);
        setGameData(record.gameData);
        setGameState('playing');
        setLocalVersion((version) => version + 1);

        await addMessageToDb('system', `${char.name} has joined the adventure!`);
        return;
      }

      const gameDocRef = doc(db, getGameDocPath(gameId));
      const shouldAnnounceJoin = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(gameDocRef);
        if (!snap.exists()) {
          throw new Error('GAME_NOT_FOUND');
        }

        const currentGame = snap.data() as GameSession;
        const currentPlayers = currentGame.players || [];
        const takenBySomeoneElse = currentPlayers.some((p) => p.charName === char.name && p.userId !== user.uid);
        if (takenBySomeoneElse) {
          throw new Error('CHARACTER_TAKEN');
        }

        const playersWithoutCurrentUser = currentPlayers.filter((p) => p.userId !== user.uid);
        const nextPlayers = [...playersWithoutCurrentUser, player];
        const nextPlayerIds = uniqueIds([...(currentGame.playerIds || []), ...nextPlayers.map((p) => p.userId), currentGame.hostId]);

        transaction.update(gameDocRef, {
          players: nextPlayers,
          playerIds: nextPlayerIds,
          lastActiveAt: serverTimestamp(),
        });

        return currentGame.hostId === user.uid;
      });

      // Firestore only permits the host to author system messages. Character
      // selection is already complete at this point, so a failed optional
      // announcement must never make the player look as though joining failed.
      if (shouldAnnounceJoin) {
        try {
          await addMessageToDb('system', `${char.name} has joined the adventure!`);
        } catch (announcementError) {
          console.warn('Character selected, but the join announcement could not be added.', announcementError);
        }
      }
    } catch (err) {
      console.error("Failed to select character", err);
      const message = err instanceof Error && err.message === 'CHARACTER_TAKEN'
        ? `${char.name} is already taken in this game.`
        : "Could not select your character. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGame = () => {
    localStorage.removeItem(GAME_ID_KEY);
    localStorage.removeItem(STORAGE_MODE_KEY);
    setStorageMode('firestore');
    setGameId(null);
    setGameData(null);
    setMessages([]);
    setSuggestions([]);
    setGameState('lobby');
    setLocalVersion((version) => version + 1);
  };
  
  const handleSend = async (text: string) => {
    // Turn enforcement
    if (gameData?.phase === 'playing' && gameData?.turnOrder && gameData.turnOrder.length > 1) {
      const activeCharName = gameData.turnOrder[gameData.currentTurnIndex ?? 0];
      if (selectedChar?.name !== activeCharName) {
        console.warn("Turn enforcement: not your turn!");
        return;
      }
    }
    await addMessageToDb('user', text);
    setSuggestions([]);
  };
  
  const handleRoll = async (
    forcedResult?: number,
    forcedOutcome?: string,
    forcedRollText?: string,
    rollStat?: 'strength' | 'agility' | 'smart' | 'spirit',
    rollRaw?: number,
    rollModifier?: number,
    rollTotal?: number
  ) => {
    // Turn enforcement
    if (gameData?.phase === 'playing' && gameData?.turnOrder && gameData.turnOrder.length > 1) {
      const activeCharName = gameData.turnOrder[gameData.currentTurnIndex ?? 0];
      if (selectedChar?.name !== activeCharName) {
        console.warn("Turn enforcement: not your turn!");
        return;
      }
    }
    const result = forcedResult ?? Math.floor(Math.random() * 20) + 1;
    let outcome = forcedOutcome || "Failure";
    if (!forcedOutcome) {
      if (result > 15) outcome = "Critical Success!";
      else if (result > 10) outcome = "Success";
      else if (result === 1) outcome = "Critical Fail!";
    }

    // Determine XP reward based on outcome
    let xpEarned = 3;
    if (outcome.includes("Critical Success")) xpEarned = 25;
    else if (outcome.includes("Success")) xpEarned = 12;
    else if (outcome.includes("Critical Fail")) xpEarned = 5;

    // Apply XP to current character
    if (selectedChar && gameData && gameId) {
      const updatedPlayers = gameData.players.map(p => {
        if (p.charName === selectedChar.name) {
          const currentXp = p.xp ?? 0;
          const newXp = currentXp + xpEarned;
          
          let rank = 'Pup';
          if (newXp >= 300) rank = 'Pack Hero';
          else if (newXp >= 150) rank = 'Apprentice';
          else if (newXp >= 50) rank = 'Trainee';

          return { ...p, xp: newXp, rank };
        }
        return p;
      });

      // Write updates
      if (storageMode === 'local') {
        const record = readLocalGame(gameId);
        if (record) {
          record.gameData = { ...record.gameData, players: updatedPlayers, lastActiveAt: Timestamp.now() };
          writeLocalGame(gameId, record);
          setGameData(record.gameData);
          setLocalVersion((version) => version + 1);
        }
      } else {
        const gameDocRef = doc(db, getGameDocPath(gameId));
        await updateDoc(gameDocRef, { players: updatedPlayers, lastActiveAt: serverTimestamp() });
      }
    }

    const rollText = forcedRollText || `*Rolls D20: ${result}* (${outcome}) (+${xpEarned} XP)`;
    await addMessageToDb('user', rollText, true, outcome, rollStat, rollRaw, rollModifier, rollTotal);
    setSuggestions([]);
  };

  const handleUpdatePlayerHp = useCallback(async (charName: string, amount: number) => {
    if (!gameId || !gameData) return;
    const updatedPlayers = gameData.players.map(p => {
      if (p.charName === charName) {
        const newHp = Math.max(0, Math.min(p.maxHp || 100, (p.hp ?? 100) + amount));
        return { ...p, hp: newHp };
      }
      return p;
    });

    if (storageMode === 'local') {
      const record = readLocalGame(gameId);
      if (!record) return;
      record.gameData = { ...record.gameData, players: updatedPlayers, lastActiveAt: Timestamp.now() };
      writeLocalGame(gameId, record);
      setGameData(record.gameData);
      setLocalVersion((version) => version + 1);
      return;
    }

    const gameDocRef = doc(db, getGameDocPath(gameId));
    await updateDoc(gameDocRef, { players: updatedPlayers, lastActiveAt: serverTimestamp() });
  }, [gameId, gameData, storageMode]);

  const handleRetryChapter = useCallback(async () => {
    if (!gameId || !gameData) return;
    const updatedPlayers = gameData.players.map(p => ({ ...p, hp: 100 }));
    
    await addMessageToDb('system', `🔄 Retry! The pack gathers their strength and retries the chapter.`);

    if (storageMode === 'local') {
      const record = readLocalGame(gameId);
      if (!record) return;
      record.gameData = { ...record.gameData, players: updatedPlayers, lastActiveAt: Timestamp.now() };
      writeLocalGame(gameId, record);
      setGameData(record.gameData);
      setLocalVersion((version) => version + 1);
      return;
    }

    const gameDocRef = doc(db, getGameDocPath(gameId));
    await updateDoc(gameDocRef, { players: updatedPlayers, lastActiveAt: serverTimestamp() });
  }, [gameId, gameData, addMessageToDb, storageMode]);

  const handleUseAbility = useCallback(async (charName: string) => {
    if (!gameId || !gameData) return;
    
    const charKey = charName.toLowerCase();
    const ability = ABILITIES[charKey];
    if (!ability) return;

    // 1. Update player list with cooldown
    const updatedPlayers = gameData.players.map(p => {
      if (p.charName === charName) {
        return { ...p, abilityCooldownChapter: gameData.chapterId };
      }
      return p;
    });

    // 2. Perform mechanical healing effect
    let systemNotice = `✨ Spirit Surge cast: ${charName} used ${ability.name}!`;
    if (ability.type === 'heal') {
      updatedPlayers.forEach(p => {
        p.hp = Math.min(p.maxHp || 100, (p.hp ?? 100) + 25);
      });
      systemNotice += ` All packmates were healed by 25 HP!`;
    }

    // 3. Write updates to DB
    if (storageMode === 'local') {
      const record = readLocalGame(gameId);
      if (!record) return;
      record.gameData = { ...record.gameData, players: updatedPlayers, lastActiveAt: Timestamp.now() };
      writeLocalGame(gameId, record);
      setGameData(record.gameData);
      setLocalVersion((version) => version + 1);
    } else {
      const gameDocRef = doc(db, getGameDocPath(gameId));
      await updateDoc(gameDocRef, { players: updatedPlayers, lastActiveAt: serverTimestamp() });
    }

    // 4. Send system message and trigger AI response
    await addMessageToDb('system', systemNotice);
    
    // Send prompt to AI
    const surgePrompt = `[SPIRIT SURGE TRIGGERED] ${ability.promptTemplate} The player has activated this magic. Please narrate the spectacular visual effect in the current environment and how it impacts the scene.`;
    await handleTriggerAIResponse(messages, surgePrompt, updatedPlayers);
  }, [gameId, gameData, messages, addMessageToDb, handleTriggerAIResponse, storageMode]);

  const handleUseItem = useCallback(async (charName: string, itemId: string) => {
    if (!gameId || !gameData) return;

    let healedAmount = 0;
    let usedItemName = '';
    let itemEffectText = '';

    const updatedPlayers = gameData.players.map(p => {
      if (p.charName === charName) {
        const inventory = p.inventory ? [...p.inventory] : [];
        const itemIdx = inventory.findIndex(i => i.id === itemId);
        if (itemIdx === -1) return p;

        const item = { ...inventory[itemIdx] };
        usedItemName = item.name;
        itemEffectText = item.effect || '';

        // Decrement quantity or remove
        if (item.quantity > 1) {
          item.quantity -= 1;
          inventory[itemIdx] = item;
        } else {
          inventory.splice(itemIdx, 1);
        }

        // Apply health effect if applicable
        let currentHp = p.hp ?? 100;
        if (itemId === 'aloe') {
          healedAmount = 5;
          currentHp = Math.min(p.maxHp || 100, currentHp + 5);
        } else if (itemId === 'berry') {
          healedAmount = 3;
          currentHp = Math.min(p.maxHp || 100, currentHp + 3);
        }

        return { ...p, inventory, hp: currentHp };
      }
      return p;
    });

    if (usedItemName === '') return; // Item not found or not owned

    // Write database / local storage update
    if (storageMode === 'local') {
      const record = readLocalGame(gameId);
      if (!record) return;
      record.gameData = { ...record.gameData, players: updatedPlayers, lastActiveAt: Timestamp.now() };
      writeLocalGame(gameId, record);
      setGameData(record.gameData);
      setLocalVersion((version) => version + 1);
    } else {
      const gameDocRef = doc(db, getGameDocPath(gameId));
      await updateDoc(gameDocRef, { players: updatedPlayers, lastActiveAt: serverTimestamp() });
    }

    // Play synthesized sound effect!
    if (healedAmount > 0) {
      audioService.playChime();
    } else {
      audioService.playClick();
    }

    // Post message
    const msgText = healedAmount > 0 
      ? `💚 ${charName} used ${usedItemName} and recovered ${healedAmount} HP! (HP: ${updatedPlayers.find(p => p.charName === charName)?.hp}/${updatedPlayers.find(p => p.charName === charName)?.maxHp})`
      : `🔧 ${charName} used ${usedItemName}: "${itemEffectText || 'Used item'}"`;
    
    await addMessageToDb('system', msgText);

    // If it's a narrative item (not just healing, or even if healing but has potential narrative context), trigger AI narration!
    if (itemId !== 'aloe' && itemId !== 'berry') {
      const itemPrompt = `[ITEM USE] ${charName} has used their ${usedItemName} (Effect: ${itemEffectText}). Please narrate how this item is used in the current scene and its immediate outcome.`;
      await handleTriggerAIResponse(messages, itemPrompt, updatedPlayers);
    }
  }, [gameId, gameData, messages, addMessageToDb, handleTriggerAIResponse, storageMode]);
  
  const retryLastAction = async () => {
     if (lastPrompt) {
      setError(null);
      // Remove the last error message before retrying
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'error') {
        const newMessages = messages.slice(0, -1);
        await handleTriggerAIResponse(newMessages, lastPrompt);
      } else {
        await handleTriggerAIResponse(messages, lastPrompt);
      }
    }
  };

  const handleContinueAdventure = () => {
    if (!gameId) {
      setGameState('lobby');
      return;
    }

    if (storageMode === 'local') {
      const record = readLocalGame(gameId);
      if (!record) {
        setError("The saved local game session could not be found.");
        setGameState('lobby');
        return;
      }

      setGameData(record.gameData);
      setMessages(sortMessages(record.messages || []));
      setSuggestions(record.suggestions || []);
      setGameState(record.gameData.players.some((p) => p.userId === user?.uid) ? 'playing' : 'selection');
      setLocalVersion((version) => version + 1);
      return;
    }

    setGameState(gameData?.players.some((p) => p.userId === user?.uid) ? 'playing' : 'selection');
  };

  const handleStartFreshLobby = () => {
    localStorage.removeItem(GAME_ID_KEY);
    localStorage.removeItem(STORAGE_MODE_KEY);
    setStorageMode('firestore');
    setGameId(null);
    setGameData(null);
    setMessages([]);
    setSuggestions([]);
    setError(null);
    setLastPrompt(null);
    setGameState('lobby');
    setLocalVersion((version) => version + 1);
  };

  const localModeNotice = storageMode === 'local'
    ? "Local browser mode: Firestore could not save this session, so it only works in this browser and cannot sync across devices."
    : null;
  
  // --- Render Logic ---
  if (gameState === 'intro') {
    return (
      <IntroScreen
        onEnterLobby={handleStartFreshLobby}
        onContinueAdventure={handleContinueAdventure}
        hasSavedGame={Boolean(gameId)}
        isAuthReady={isAuthReady}
      />
    );
  }

  if (gameState === 'lobby') {
    return (
        <LobbyScreen 
            onCreateGame={handleCreateGame}
            onJoinGame={handleJoinGame}
            isLoading={isLoading}
            error={error}
            modeNotice={localModeNotice}
        />
    );
  }

  if (gameState === 'selection' || (gameData && !selectedChar)) {
    return (
      <CharacterSelectionScreen
        onSelectChar={handleSelectChar}
        onLeaveGame={handleLeaveGame}
        isLoading={isLoading}
        error={error}
        gameId={gameId}
        playersInGame={gameData?.players || []}
        modeNotice={localModeNotice}
      />
    );
  }

  if (gameData && selectedChar) {
    return (
      <GameScreen
        messages={messages}
        selectedChar={selectedChar}
        suggestions={suggestions}
        isThinking={isThinking}
        onSendMessage={handleSend}
        onRoll={handleRoll}
        onLeaveGame={handleLeaveGame}
        onRetry={retryLastAction}
        gameId={gameId}
        players={gameData.players}
        playerRole={playerRole}
        modeNotice={localModeNotice}
        chapterId={gameData.chapterId || 'chapter_1'}
        objective={gameData.objective || 'Investigate the Moonshine River and find out what is making the water sick.'}
        scene={gameData.scene || 'river'}
        packWarmth={gameData.packWarmth ?? 100}
        packHeart={gameData.packHeart ?? 100}
        gameStatus={gameData.status || 'active'}
        onUpdatePlayerHp={handleUpdatePlayerHp}
        onRetryChapter={handleRetryChapter}
        onUseAbility={handleUseAbility}
        onUseItem={handleUseItem}
        phase={gameData.phase || 'initiative'}
        turnOrder={gameData.turnOrder || []}
        currentTurnIndex={gameData.currentTurnIndex ?? 0}
        onInitiativeRoll={handleInitiativeRoll}
        onSpendPackHeart={handleSpendPackHeart}
        suggestionsByPup={gameData.suggestionsByPup}
      />
    );
  }

  // Fallback / Loading state
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
      <p>Loading your adventure...</p>
    </div>
  );
}
