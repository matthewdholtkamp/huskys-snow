import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { auth, db, getGameCollectionPath, getGameDocPath, getMessagesColPath } from './services/firebaseService';
import { generateAIResponse } from './services/geminiService';
import { CHARACTERS } from './constants';
import type { GameState, Character, Player, Message, GameSession } from './types';

import IntroScreen from './components/IntroScreen';
import LobbyScreen from './components/LobbyScreen';
import CharacterSelectionScreen from './components/CharacterSelectionScreen';
import GameScreen from './components/GameScreen';

const GAME_ID_KEY = 'husky-snow-gameId';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [gameId, setGameId] = useState<string | null>(() => localStorage.getItem(GAME_ID_KEY));
  const [gameData, setGameData] = useState<GameSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  
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
    if (!gameId || !db) return;

    const gameDocRef = doc(db, getGameDocPath(gameId));
    const gameUnsubscribe = onSnapshot(gameDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameSession;
        setGameData({ ...data, id: docSnap.id });
        setGameState('playing'); // If we have game data, we are in the game.
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
      setMessages(msgs);
    });

    return () => {
      gameUnsubscribe();
      messagesUnsubscribe();
    };
  }, [gameId]);


  // FIX: Explicitly typed the useMemo return value to prevent `playerRole` from being widened to `string`.
  const { selectedChar, playerRole } = useMemo((): { selectedChar: Character | null; playerRole: 'host' | 'player' | 'spectator' } => {
    if (!user || !gameData) return { selectedChar: null, playerRole: 'spectator' };
    const player = gameData.players.find(p => p.userId === user.uid);
    const char = CHARACTERS.find(c => c.name === player?.charName) || null;
    const role: 'host' | 'player' | 'spectator' = player ? (gameData.hostId === user.uid ? 'host' : 'player') : 'spectator';
    return { selectedChar: char, playerRole: role };
  }, [user, gameData]);


  // --- AI Trigger Effect (Host-only) ---
  useEffect(() => {
    if (playerRole !== 'host' || isThinking || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
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

  const addMessageToDb = useCallback(async (role: Message['role'], text: string, isRoll = false) => {
    if (!gameId || !user) return;
    const authorName = role === 'model' ? 'Quinn' : role === 'system' ? 'System' : (selectedChar?.name || 'Player');
    const newMessage = {
      role,
      text,
      author: authorName,
      isRoll,
      timestamp: serverTimestamp(),
    };
    await addDoc(collection(db, getMessagesColPath(gameId)), newMessage);
  }, [gameId, user, selectedChar]);

  const handleTriggerAIResponse = useCallback(async (history: Message[], prompt: string) => {
    if (!gameData) return;
    setIsThinking(true);
    setSuggestions([]);
    setLastPrompt(prompt);
    
    try {
      const { narrative, suggestions: newSuggestions } = await generateAIResponse(history, prompt, gameData.players);
      await addMessageToDb('model', narrative);
      setSuggestions(newSuggestions);
    } catch (err: any) {
      console.error("AI Response Error:", err);
      await addMessageToDb('error', `⚠️ ${err.message || "Connection lost."}`);
    } finally {
      setIsThinking(false);
    }
  }, [gameData, addMessageToDb]);

  // --- Game Flow Functions ---
  const handleCreateGame = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const newGame: Omit<GameSession, 'id'> = {
        hostId: user.uid,
        players: [],
        createdAt: serverTimestamp() as Timestamp
      };
      const gameCollection = collection(db, getGameCollectionPath());
      const docRef = await addDoc(gameCollection, newGame);
      localStorage.setItem(GAME_ID_KEY, docRef.id);
      setGameId(docRef.id);
      setGameState('selection');
    } catch (err) {
      console.error("Failed to create game", err);
      setError("Could not create a new game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (idToJoin: string) => {
    if (!idToJoin.trim()) {
        setError("Please enter a Game ID.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const gameDocRef = doc(db, getGameDocPath(idToJoin));
        const docSnap = await getDoc(gameDocRef);
        if (docSnap.exists()) {
            localStorage.setItem(GAME_ID_KEY, idToJoin);
            setGameId(idToJoin);
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
      const player: Player = { userId: user.uid, charName: char.name };
      const gameDocRef = doc(db, getGameDocPath(gameId));
      await updateDoc(gameDocRef, {
        players: arrayUnion(player)
      });
      // Add system message for joining
      await addMessageToDb('system', `${char.name} has joined the adventure!`);
      // Initial prompt for the very first player
      if (gameData?.players.length === 0) {
        const dmInstruction = `INITIATE SESSION. The first player is ${char.name}. Starting Scene: ${char.startingScene}. Task: Narrate the scene. Add atmospheric details. End with: "What do you do?" and provide 3-4 suggestions.`;
        await handleTriggerAIResponse([], dmInstruction);
      }
    } catch (err) {
      console.error("Failed to select character", err);
      setError("Could not select your character. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGame = () => {
    localStorage.removeItem(GAME_ID_KEY);
    setGameId(null);
    setGameData(null);
    setMessages([]);
    setSuggestions([]);
    setGameState('lobby');
  };
  
  const handleSend = async (text: string) => {
    await addMessageToDb('user', text);
    setSuggestions([]);
  };
  
  const handleRoll = async () => {
    const result = Math.floor(Math.random() * 20) + 1;
    let outcome = "Failure";
    if (result > 15) outcome = "Critical Success!";
    else if (result > 10) outcome = "Success";
    else if (result === 1) outcome = "Critical Fail!";
    const rollText = `*Rolls D20... Result: ${result}* (${outcome})`;
    await addMessageToDb('user', rollText, true);
    setSuggestions([]);
  };
  
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
  
  // --- Render Logic ---
  if (gameState === 'intro') {
    return <IntroScreen onEnterLobby={() => setGameState('lobby')} isAuthReady={isAuthReady} />;
  }

  if (gameState === 'lobby') {
    return (
        <LobbyScreen 
            onCreateGame={handleCreateGame}
            onJoinGame={handleJoinGame}
            isLoading={isLoading}
            error={error}
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