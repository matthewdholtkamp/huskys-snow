import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, getMessagesColPath } from '../../services/firebaseService';
import { CHARACTERS } from '../../src/constants';
import type { Message, Character, Player, InventoryItem, Badge } from '../../src/types';

// UI Components
import { BackgroundLayer } from './ui/BackgroundLayer';
import { FrostContainer } from './ui/FrostContainer';
import { CharacterSheet } from './game/CharacterSheet';
import { InventoryGrid } from './game/InventoryGrid';
import { MessageLog } from './game/MessageLog';
import { ActionBar } from './game/ActionBar';
import { Dice3D } from './effects/Dice3D';
import { ScreenShake } from './effects/ScreenShake';
import { LogOut, RefreshCw } from 'lucide-react';

interface GameScreenProps {
  messages: Message[];
  selectedChar: Character;
  suggestions: string[];
  isThinking: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onRoll: () => Promise<void>; // Legacy, we might override this
  onLeaveGame: () => void;
  onRetry: () => void;
  gameId: string | null;
  players: Player[];
  playerRole: 'host' | 'player' | 'spectator';
}

export default function GameScreen({
  messages,
  selectedChar,
  suggestions,
  isThinking,
  onSendMessage,
  onLeaveGame,
  onRetry,
  gameId,
  players,
  playerRole
}: GameScreenProps) {

  // Local State
  const [showDice, setShowDice] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [localInventory, setLocalInventory] = useState<InventoryItem[]>([]);
  const [localBadges, setLocalBadges] = useState<Badge[]>([]);

  // Sync Inventory/Badges from Players List
  useEffect(() => {
    if (!players) return;
    const myPlayer = players.find(p => p.charName === selectedChar.name);
    if (myPlayer) {
      if (myPlayer.inventory) setLocalInventory(myPlayer.inventory);
      if (myPlayer.badges) setLocalBadges(myPlayer.badges);
    }
  }, [players, selectedChar.name]);


  // --- Action Handlers ---

  const handleAction = async (actionText: string) => {
    // 1. Send User Action
    await onSendMessage(actionText);

    // 2. AI triggers are handled by the Host in App.tsx generally,
    // but here we might need to intercept commands if we were moving logic here.
    // For now, App.tsx handles the AI call. We just wait.
  };

  const handleRollComplete = async (result: number) => {
    setShowDice(false);

    // Determine outcome
    let outcome = "Failure";
    if (result > 15) outcome = "Critical Success!";
    else if (result > 10) outcome = "Success";
    else if (result === 1) outcome = "Critical Fail!";

    const rollText = `*Rolls D20... Result: ${result}* (${outcome})`;

    // Add roll message
    if (gameId) {
      const newMessage = {
        role: 'user',
        text: rollText,
        author: selectedChar.name,
        isRoll: true,
        rollOutcome: outcome,
        timestamp: serverTimestamp(),
      };
      // We use the raw firestore call here or pass a prop.
      // Let's use the direct db call to ensure fields match
      await addDoc(collection(db, getMessagesColPath(gameId)), newMessage);
    }

    // Trigger Screen Shake on low rolls (damage implication)
    if (result <= 5) {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
    }
  };

  const triggerDice = () => {
    setShowDice(true);
  };

  // Check last message for "Roll the D20" command from AI
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'model' && lastMsg.text.includes('Roll the D20')) {
       // Only the active player should see the roll prompt if it's their turn,
       // but in this coop simplified version, we just show a "Roll" button or auto-trigger?
       // Better: The User sees a "Roll Dice" button in the Action Bar if the AI asked for it?
       // For now, let's just let the user click the "Roll" suggestion which usually appears.
    }
  }, [messages]);

  // Extract specific AI commands (Host Only execution usually, but we need to update DB)
  // Since App.tsx calls generateAIResponse, we need to ensure IT parses commands.
  // Wait, App.tsx is currently using the OLD generateAIResponse.
  // I need to update App.tsx to use the NEW generateAIResponse and handle the commands.
  // But for now, let's focus on the UI rendering.

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans text-slate-200">
      <BackgroundLayer scene="default" />

      <ScreenShake trigger={shakeTrigger}>
        <div className="relative z-10 w-full h-full flex flex-col md:flex-row p-4 gap-4">

          {/* LEFT COLUMN: Character & Stats (Hidden on mobile, drawer optional?) */}
          <div className="hidden md:flex w-1/4 flex-col gap-4">
             <CharacterSheet character={selectedChar} earnedBadges={localBadges} />
             <InventoryGrid items={localInventory} />
          </div>

          {/* CENTER: Main Game Area */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
             {/* Header */}
             <div className="flex justify-between items-center bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                <h1 className="text-lg font-serif font-bold text-white tracking-widest">
                  Husky's Snow <span className="text-slate-400 text-xs font-sans font-normal">| {playerRole.toUpperCase()}</span>
                </h1>
                <div className="flex gap-2">
                   {playerRole === 'host' && (
                     <button onClick={onRetry} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Retry AI Response">
                       <RefreshCw className="w-4 h-4 text-slate-300" />
                     </button>
                   )}
                   <button onClick={onLeaveGame} className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-400" title="Leave Game">
                     <LogOut className="w-4 h-4" />
                   </button>
                </div>
             </div>

             {/* Chat / Story Log */}
             <MessageLog messages={messages} />

             {/* Action Bar */}
             <div className="mt-auto">
               <FrostContainer className="p-4" noBorder>
                  {/* If AI asks for roll, we could inject a special button here or relying on suggestions */}
                  {messages.length > 0 && messages[messages.length-1].text.includes("Roll the D20") && !isThinking ? (
                     <button
                       onClick={triggerDice}
                       className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/30 mb-4 animate-bounce"
                     >
                       🎲 ROLL THE D20
                     </button>
                  ) : null}

                  <ActionBar
                    suggestions={suggestions}
                    onAction={handleAction}
                    characterName={selectedChar.name}
                    isThinking={isThinking}
                  />
               </FrostContainer>
             </div>
          </div>

          {/* RIGHT COLUMN: Mobile Inventory / Extra Info (Optional, keeping simple for now) */}
          {/* Could be used for Party Status in future */}
        </div>
      </ScreenShake>

      {/* Overlays */}
      <Dice3D isRolling={showDice} onRollComplete={handleRollComplete} />

    </div>
  );
}
