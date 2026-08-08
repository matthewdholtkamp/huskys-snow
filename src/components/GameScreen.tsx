import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, Character, Player, InventoryItem, Badge } from '../../src/types';
import { parseRollRequest, getModifier, getRollOutcome, REVERSE_STAT_MAP } from '../../src/game/rolls';
import { getChapter } from '../../src/game/chapters';
import { ABILITIES } from '../../src/game/magic';

// UI Components
import { BackgroundLayer } from './ui/BackgroundLayer';
import { FrostContainer } from './ui/FrostContainer';
import { CharacterSheet } from './game/CharacterSheet';
import { InventoryGrid } from './game/InventoryGrid';
import { MessageLog } from './game/MessageLog';
import { ActionBar } from './game/ActionBar';
import { Dice3D } from './effects/Dice3D';
import { ScreenShake } from './effects/ScreenShake';
import { ObjectiveTracker } from './game/ObjectiveTracker';
import { AbilityBar } from './game/AbilityBar';
import { MagicBurst, VFXType } from './effects/MagicBurst';
import { PartyStatus } from './game/PartyStatus';
import { BottomSheet } from './game/BottomSheet';
import { ItemUseMenu } from './game/ItemUseMenu';
import { SpiritCollection } from './game/SpiritCollection';
import { TutorialOverlay } from './game/TutorialOverlay';
import { Dice5, LogOut, RefreshCw, Heart, Star, Sparkles, Compass, HelpCircle, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { InitiativeOverlay } from './game/InitiativeOverlay';

interface GameScreenProps {
  messages: Message[];
  selectedChar: Character;
  suggestions: string[];
  isThinking: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onRoll: (
    result?: number,
    outcome?: string,
    rollText?: string,
    rollStat?: 'strength' | 'agility' | 'smart' | 'spirit',
    rollRaw?: number,
    rollModifier?: number,
    rollTotal?: number
  ) => Promise<void>;
  onLeaveGame: () => void;
  onRetry: () => void;
  gameId: string | null;
  players: Player[];
  playerRole: 'host' | 'player' | 'spectator';
  modeNotice?: string | null;
  chapterId: string;
  objective: string;
  scene: string;
  packWarmth: number;
  packHeart: number;
  gameStatus: 'active' | 'ended';
  onUpdatePlayerHp: (charName: string, amount: number) => Promise<void>;
  onRetryChapter: () => Promise<void>;
  onUseAbility: (charName: string) => Promise<void>;
  onUseItem?: (charName: string, itemId: string) => Promise<void>;
  phase?: 'initiative' | 'playing';
  turnOrder?: string[];
  currentTurnIndex?: number;
  onInitiativeRoll?: (result: number) => void;
  onSpendPackHeart?: (amount: number, reason: string) => Promise<void>;
  suggestionsByPup?: Record<string, string[]>;
}

export default function GameScreen({
  messages,
  selectedChar,
  suggestions,
  isThinking,
  onSendMessage,
  onRoll,
  onLeaveGame,
  onRetry,
  gameId,
  players,
  playerRole,
  modeNotice,
  chapterId,
  objective,
  scene,
  packWarmth,
  packHeart = 100,
  gameStatus,
  onUpdatePlayerHp,
  onRetryChapter,
  onUseAbility,
  onUseItem,
  phase = 'initiative',
  turnOrder = [],
  currentTurnIndex = 0,
  onInitiativeRoll,
  onSpendPackHeart,
  suggestionsByPup,
}: GameScreenProps) {

  // Local State
  const [showDice, setShowDice] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [localInventory, setLocalInventory] = useState<InventoryItem[]>([]);
  const [localBadges, setLocalBadges] = useState<Badge[]>([]);
  const [magicTrigger, setMagicTrigger] = useState(0);
  const [magicVfxType, setMagicVfxType] = useState<VFXType>('blue_orbs');
  const [showFinaleEditor, setShowFinaleEditor] = useState(false);
  const [finaleChoice, setFinaleChoice] = useState<'light' | 'dark' | null>(null);
  const [endingText, setEndingText] = useState('');
  const [activeItemToUse, setActiveItemToUse] = useState<InventoryItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSpirits, setShowSpirits] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('husky-snow-tutorial-completed') !== 'true';
  });
  const [showLevelUpRank, setShowLevelUpRank] = useState<string | null>(null);
  const [mistHint, setMistHint] = useState<string | null>(null);
  const [recapText, setRecapText] = useState<string | null>(null);
  const [loadingRecap, setLoadingRecap] = useState(false);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [showReflectionChapId, setShowReflectionChapId] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(() => audioService.isMuted());
  const [reducedMotionSetting, setReducedMotionSetting] = useState(() => localStorage.getItem('husky-snow-reduced-motion') === 'true');

  const myPlayer = players.find(p => p.charName === selectedChar.name);
  const activePlayerName = (turnOrder && turnOrder.length > 0 && currentTurnIndex !== undefined && currentTurnIndex < turnOrder.length)
    ? turnOrder[currentTurnIndex]
    : null;
  const isMyTurn = activePlayerName 
    ? activePlayerName === selectedChar.name 
    : true;
  const isUnrankedLateJoiner = phase === 'playing'
    && myPlayer
    && myPlayer.initiativeRoll === undefined
    && !turnOrder.includes(myPlayer.charName)
    && players.length > 1;
  const showInitiativeOverlay = (phase === 'initiative' || isUnrankedLateJoiner) && !showTutorial;
  const showTurnBanner = phase === 'playing' && turnOrder && turnOrder.length > 1;

  const prevRankRef = useRef<string | null>(null);

  const toggleMute = () => {
    const newVal = !isAudioMuted;
    audioService.setMuted(newVal);
    setIsAudioMuted(newVal);
  };

  const toggleMotion = () => {
    const newVal = !reducedMotionSetting;
    setReducedMotionSetting(newVal);
    localStorage.setItem('husky-snow-reduced-motion', String(newVal));
    window.dispatchEvent(new Event('husky-snow-settings-changed'));
  };

  // Sync Inventory/Badges from Players List
  useEffect(() => {
    if (!players) return;
    const myPlayer = players.find(p => p.charName === selectedChar.name);
    if (myPlayer) {
      if (myPlayer.inventory) setLocalInventory(myPlayer.inventory);
      if (myPlayer.badges) setLocalBadges(myPlayer.badges);
    }
  }, [players, selectedChar.name]);

  // Level Up / Rank Up Notification Effect
  useEffect(() => {
    if (!players || !selectedChar) return;
    const myPlayer = players.find(p => p.charName === selectedChar.name);
    if (!myPlayer) return;

    const currentRank = myPlayer.rank || 'Pup';
    
    // Initialize or check if rank increased
    if (prevRankRef.current !== null && prevRankRef.current !== currentRank) {
      // Rank has changed! Show level up popup and play chime
      setShowLevelUpRank(currentRank);
      audioService.playFanfare();
    }
    
    prevRankRef.current = currentRank;
  }, [players, selectedChar]);

  const prevChapterIdRef = useRef(chapterId);
  useEffect(() => {
    if (prevChapterIdRef.current && prevChapterIdRef.current !== chapterId) {
      // Chapter transitioned! Show reflection for the one that just finished
      setShowReflectionChapId(prevChapterIdRef.current);
    }
    prevChapterIdRef.current = chapterId;
  }, [chapterId]);

  useEffect(() => {
    // Only show recap if there are existing messages in history (resuming a game)
    // and we haven't already dismissed it in this session.
    if (messages.length > 3 && gameId && !sessionStorage.getItem(`husky-recap-shown-${gameId}`)) {
      setLoadingRecap(true);
      setShowRecapModal(true);
      
      const fetchRecap = async () => {
        try {
          const { summarizeHistory } = await import('../../services/geminiService');
          const gameMessages = messages.filter(m => m.role === 'user' || m.role === 'model');
          const summary = await summarizeHistory(gameMessages.slice(0, -1));
          setRecapText(summary);
        } catch (err) {
          console.error("Failed to generate recap:", err);
          setRecapText("The story continues as the pack moves forward...");
        } finally {
          setLoadingRecap(false);
        }
      };
      
      fetchRecap();
    }
  }, [gameId]);

  const getEpisodeReflection = (completedChapId: string) => {
    const heartMessages = messages.filter(m => m.role === 'system' && m.text.includes('PACK HEART'));
    const valuesShown = {
      courage: false,
      empathy: false,
      teamwork: false,
      perseverance: false,
    };
    const details: string[] = [];

    heartMessages.forEach(m => {
      const text = m.text.toLowerCase();
      if (text.includes('courage')) valuesShown.courage = true;
      if (text.includes('empathy')) valuesShown.empathy = true;
      if (text.includes('teamwork')) valuesShown.teamwork = true;
      if (text.includes('perseverance')) valuesShown.perseverance = true;
      
      const cleanText = m.text.replace('💖 PACK HEART', '').trim();
      details.push(cleanText);
    });

    return { valuesShown, details };
  };

  // Mist Idle Hint System (30 seconds idle trigger)
  useEffect(() => {
    if (isThinking || showDice || gameStatus === 'ended' || isDrawerOpen || showTutorial || showSpirits) return;

    const idleTimeout = setTimeout(() => {
      let hint = "Listen to the wind. What will you do next?";
      switch (chapterId) {
        case 'chapter_1':
          hint = "Mist whispers: 'Look closely at the river. A D20 roll might reveal what is poisoning the water.'";
          break;
        case 'chapter_2':
          hint = "Mist whispers: 'Go speak with Starwhirl back at camp. He knows of the ancient prophecy.'";
          break;
        case 'chapter_3':
          hint = "Mist whispers: 'The elders are alert. An Agility roll could help you sneak past camp boundary unnoticed.'";
          break;
        case 'chapter_4':
          hint = "Mist whispers: 'Watch the road edges. Search for a hidden route around the coyote pack.'";
          break;
        case 'chapter_5':
          hint = "Mist whispers: 'Confronting them directly is dangerous. Perhaps use a trap or sneak around.'";
          break;
        case 'chapter_6':
          hint = "Mist whispers: 'Focus your spirit. Connect with the ancient dreams of the Dreamlands.'";
          break;
        case 'chapter_7':
          hint = "Mist whispers: 'The Frost Crystal is before you. Ignite it to make your choice.'";
          break;
      }
      setMistHint(hint);
      
      // Auto-dismiss after 8 seconds
      const dismissTimeout = setTimeout(() => {
        setMistHint(null);
      }, 8000);

      return () => clearTimeout(dismissTimeout);

    }, 30000); // 30 seconds idle

    return () => clearTimeout(idleTimeout);
  }, [messages.length, isThinking, showDice, chapterId, gameStatus, isDrawerOpen, showTutorial, showSpirits]);

  const myHp = myPlayer?.hp ?? 100;
  const isDowned = myHp === 0;

  const downedTeammate = players?.find(p => p.hp === 0 && p.charName !== selectedChar.name);
  const isMultiplayer = players?.length > 1;

  const currentChapterDef = getChapter(chapterId);
  const chapterTitle = currentChapterDef ? currentChapterDef.title : `Chapter ${chapterId}`;

  const hasCrystal = localInventory.some(item => item.id === 'crystal' && item.quantity > 0);
  const showIgniteButton = chapterId === 'chapter_7' && hasCrystal && gameStatus !== 'ended' && !showFinaleEditor;

  // Find the last model message to check for roll requests
  const lastModelMessage = [...messages].reverse().find(m => m.role === 'model');
  const aiRequestedRoll = lastModelMessage ? lastModelMessage.text.includes("Roll the D20") : false;

  // Find if there has been a subsequent roll message resolving it
  const lastModelIndex = lastModelMessage ? messages.findIndex(m => m.id === lastModelMessage.id) : -1;
  const rollAlreadyDone = lastModelIndex !== -1 && messages.slice(lastModelIndex + 1).some(m => m.isRoll);

  const isRollRequired = aiRequestedRoll && !rollAlreadyDone;

  // Determine if there is an active stat roll requested by the AI
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const activeStatKey = (isRollRequired && lastModelMessage) ? parseRollRequest(lastModelMessage.text) : null;
  const activeModifier = activeStatKey ? getModifier(selectedChar.stats[activeStatKey]) : 0;
  const activeStatAbbr = activeStatKey ? REVERSE_STAT_MAP[activeStatKey] : '';


  // --- Action Handlers ---

  const handleAction = async (actionText: string) => {
    await onSendMessage(actionText);
  };

  const handleUseAbilityClick = async () => {
    const ability = ABILITIES[selectedChar.id.toLowerCase()];
    if (!ability) return;

    setMagicVfxType(ability.vfxType);
    setMagicTrigger(prev => prev + 1);
    await onUseAbility(selectedChar.name);
  };

  const handleRollComplete = async (result: number) => {
    setShowDice(false);

    const total = result + activeModifier;
    const outcome = getRollOutcome(total, result);

    let rollText = '';
    if (activeStatKey) {
      const sign = activeModifier >= 0 ? '+' : '-';
      rollText = `*Rolls D20: ${result} ${sign}${activeStatAbbr}(${Math.abs(activeModifier)}) = ${total} → ${outcome}!*`;
    } else {
      rollText = `*Rolls D20: ${result} = ${total} → ${outcome}!*`;
    }

    await onRoll(result, outcome, rollText, activeStatKey || undefined, result, activeModifier, total);

    // Trigger critical success gold burst VFX
    if (result === 20) {
      setMagicVfxType('crit_gold');
      setMagicTrigger(prev => prev + 1);
    }

    // Trigger Screen Shake on low rolls (damage implication or critical fumbles)
    if (result === 1 || total <= 5) {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
    }
  };

  const triggerDice = () => {
    if (showDice) return;
    setShowDice(true);
  };

  const canRoll = playerRole !== 'spectator' && !isThinking && !showDice;

  return (
    <div className="relative h-[100svh] w-full overflow-hidden font-sans text-slate-200">
      <BackgroundLayer scene={scene} />

      <ScreenShake trigger={shakeTrigger}>
        <div className="relative z-10 box-border flex h-full min-h-0 w-full flex-col gap-3 p-2.5 sm:p-3 md:flex-row md:gap-4 md:p-4">

          {/* LEFT COLUMN: Character & Stats (Hidden on mobile, drawer optional?) */}
          <aside className="custom-scrollbar hidden min-h-0 w-72 shrink-0 flex-col gap-3 overflow-y-auto pr-1 md:flex xl:w-80" aria-label="Pup and pack details">
             <CharacterSheet character={selectedChar} earnedBadges={localBadges} health={myHp} />
             <InventoryGrid items={localInventory} onItemSelect={(item) => setActiveItemToUse(item)} />
             <PartyStatus players={players} localPlayerCharName={selectedChar.name} />
          </aside>

          {/* CENTER: Main Game Area */}
          <main className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col gap-2.5 md:gap-3">
             {/* Header */}
             <header className="flex shrink-0 items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/65 px-3 py-2.5 backdrop-blur-md">
                <div className="min-w-0">
                  <h1 className="truncate font-serif text-base font-bold tracking-wide text-white md:text-lg">
                    Husky's Snow <span className="ml-1 hidden font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/70 sm:inline">{playerRole}</span>
                  </h1>
                  {gameId && <p className="truncate font-mono text-[9px] uppercase tracking-wider text-slate-600">Game {gameId.slice(0, 12)}</p>}
                </div>
                <div className="flex shrink-0 items-center justify-end" aria-label="Game utilities">
                   <button onClick={() => setShowSpirits(true)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-cyan-200 sm:h-9 sm:w-9" title="View Spirit Collection" aria-label="View Spirit Collection">
                     <Compass className="w-4 h-4" />
                   </button>
                   <button onClick={() => setShowTutorial(true)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-cyan-200 sm:h-9 sm:w-9" title="View Onboarding Tutorial" aria-label="View Onboarding Tutorial">
                     <HelpCircle className="w-4 h-4" />
                   </button>
                   <button onClick={toggleMute} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-cyan-200 sm:h-9 sm:w-9" title={isAudioMuted ? "Unmute Sound" : "Mute Sound"} aria-label={isAudioMuted ? "Unmute Sound" : "Mute Sound"}>
                     {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                   </button>
                   <button onClick={toggleMotion} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-cyan-200 sm:h-9 sm:w-9" title={reducedMotionSetting ? "Enable Motion/Effects" : "Disable Motion/Effects"} aria-label={reducedMotionSetting ? "Enable Motion/Effects" : "Disable Motion/Effects"}>
                     {reducedMotionSetting ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                   {playerRole === 'host' && (
                     <button onClick={onRetry} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-cyan-200 sm:h-9 sm:w-9" title="Retry AI Response" aria-label="Retry AI Response">
                       <RefreshCw className="w-4 h-4" />
                     </button>
                   )}
                   <span className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />
                   <button onClick={onLeaveGame} className="grid h-8 w-8 place-items-center rounded-lg text-rose-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300 sm:h-9 sm:w-9" title="Leave Game" aria-label="Leave Game">
                     <LogOut className="w-4 h-4" />
                   </button>
                </div>
             </header>

             {/* Objective Tracker HUD */}
             <div className="shrink-0">
               <ObjectiveTracker chapterTitle={chapterTitle} objectiveText={objective} packHeart={packHeart} />
             </div>

             {modeNotice && (
               <div className="shrink-0 bg-amber-950/70 border border-amber-700/50 text-amber-100 text-sm rounded-lg px-4 py-3">
                 {modeNotice}
               </div>
             )}

             <button
               type="button"
               onClick={() => setIsDrawerOpen(true)}
               className="grid shrink-0 grid-cols-3 gap-1 rounded-xl border border-white/10 bg-slate-950/45 p-1 text-center text-xs transition-colors hover:bg-white/5 active:bg-white/10 md:hidden"
               aria-label="Open pup, inventory, and pack details"
             >
               <div className="bg-black/35 border border-white/5 rounded-lg px-3 py-2">
                 <div className="text-slate-400 uppercase tracking-wider text-[10px]">Pup</div>
                 <div className="font-bold text-white truncate text-sm flex items-center justify-center gap-1">
                   {selectedChar.name} <Sparkles className="w-3.5 h-3.5 text-indigo-300 fill-indigo-400/20" />
                 </div>
               </div>
               <div className="bg-black/35 border border-white/5 rounded-lg px-3 py-2">
                 <div className="text-slate-400 uppercase tracking-wider text-[10px]">HP</div>
                 <div className="font-bold text-emerald-400 text-sm">{myHp} / 100</div>
               </div>
               <div className="bg-black/35 border border-white/5 rounded-lg px-3 py-2">
                 <div className="text-slate-400 uppercase tracking-wider text-[10px]">Badges</div>
                 <div className="font-bold text-amber-300 text-sm">{localBadges.length}</div>
               </div>
             </button>

             {/* Chat / Story Log */}
             <MessageLog messages={messages} />

             {/* Action Bar */}
             <div className="shrink-0 relative">
               {mistHint && (
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-11/12 max-w-md bg-purple-950/90 border border-purple-500/40 text-purple-200 text-xs px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-md flex items-start gap-2.5 z-40 animate-fade-in-up">
                   <span className="text-xl">🦉</span>
                   <div>
                     <span className="font-serif font-bold text-purple-300 uppercase tracking-widest block text-[9px] mb-0.5">Mist's telepathic nudge</span>
                     <span className="font-serif leading-relaxed italic">"{mistHint.replace("Mist whispers: ", "")}"</span>
                   </div>
                 </div>
               )}
               <FrostContainer className="rounded-2xl border border-white/10 bg-slate-950/55 p-3 md:p-3.5" noBorder>
                    {/* Turn Status Banner */}
                    {showTurnBanner && (
                      isMyTurn ? (
                        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                          <span className="animate-pulse">🎯</span>
                          <span>Your turn, {selectedChar.name}!</span>
                        </div>
                      ) : (
                        <div className="mb-4 bg-slate-950/40 border border-white/5 text-slate-400 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                          <span className="animate-pulse">⏳</span>
                          <span>Waiting for {activePlayerName}'s turn...</span>
                        </div>
                      )
                    )}

                    {/* Ability Bar */}
                    {!isDowned && (
                       <div className="mb-4">
                         <AbilityBar
                           charId={selectedChar.id}
                           cooldownChapter={myPlayer?.abilityCooldownChapter}
                           currentChapterId={chapterId}
                           onUseAbility={handleUseAbilityClick}
                           disabled={isThinking || !isMyTurn || isRollRequired}
                         />
                       </div>
                    )}

                    {/* Cooperative multiplayer revive action */}
                    {downedTeammate && !isDowned && (
                       <button
                         onClick={async () => {
                           if (!isMyTurn || packHeart < 30) return;
                           if (onSpendPackHeart) {
                             await onSpendPackHeart(30, `reviving ${downedTeammate.charName}`);
                           }
                           await onUpdatePlayerHp(downedTeammate.charName, 50);
                           await onSendMessage(`spend my turn and 30 Pack Heart to revive my packmate ${downedTeammate.charName}!`);
                         }}
                         disabled={!isMyTurn || packHeart < 30 || isRollRequired}
                         className={`w-full py-4 text-white font-bold rounded-lg shadow-lg mb-4 flex items-center justify-center gap-2 transition-all ${
                           (!isMyTurn || packHeart < 30 || isRollRequired)
                             ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed shadow-none opacity-50' 
                             : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30 active:scale-95'
                         }`}
                       >
                         <Heart className={`w-5 h-5 fill-white ${isMyTurn && packHeart >= 30 ? 'animate-pulse' : ''}`} /> 
                         Revive {downedTeammate.charName} (Costs 30 Pack Heart, restores 50 HP)
                       </button>
                    )}

                    {/* Ignite Frost Crystal option */}
                    {showIgniteButton && (
                       <button
                         onClick={() => isMyTurn && !isRollRequired && setShowFinaleEditor(true)}
                         disabled={!isMyTurn || isRollRequired}
                         className={`w-full py-4 text-white font-bold rounded-lg shadow-xl mb-4 flex items-center justify-center gap-2 transition-all ${
                           (!isMyTurn || isRollRequired) 
                             ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed shadow-none opacity-50' 
                             : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-indigo-500/20 hover:scale-[1.01] animate-pulse active:scale-95'
                         }`}
                       >
                         <Star className="w-5 h-5 fill-white" /> Ignite the Frost Crystal
                       </button>
                    )}

                    {/* If AI asks for roll, we could inject a special button here or relying on suggestions */}
                    {canRoll && !isDowned && !showIgniteButton ? (
                       <button
                         onClick={triggerDice}
                         disabled={showDice || !isMyTurn}
                         className={`mb-3 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-extrabold transition-all ${
                           !isMyTurn 
                             ? 'cursor-not-allowed border-white/5 bg-slate-800 text-slate-500 opacity-50'
                             : isRollRequired
                               ? 'border-cyan-200 bg-cyan-300 text-slate-950 shadow-[0_8px_24px_rgba(34,211,238,0.18)] hover:bg-cyan-200 active:translate-y-px'
                               : 'border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-100 hover:border-cyan-300/40 hover:bg-cyan-300/10 active:translate-y-px'
                         }`}
                       >
                         <Dice5 className="w-5 h-5" /> Roll D20
                       </button>
                    ) : null}

                    {/* Re-roll option */}
                    {canRoll && !isDowned && !showIgniteButton && lastMessage?.isRoll && !isRollRequired && (
                       <button
                         onClick={async () => {
                           if (!isMyTurn || packHeart < 20) return;
                           if (onSpendPackHeart) {
                             await onSpendPackHeart(20, 're-rolling failed check');
                           }
                           triggerDice();
                         }}
                         disabled={!isMyTurn || packHeart < 20 || showDice}
                         className={`w-full py-4 text-white font-bold rounded-lg shadow-lg mb-4 flex items-center justify-center gap-2 transition-all ${
                           (!isMyTurn || packHeart < 20)
                             ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed shadow-none opacity-50' 
                             : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/30 active:scale-[0.98]'
                         }`}
                       >
                         <RefreshCw className="w-5 h-5" /> Re-roll D20 (Costs 20 Pack Heart)
                       </button>
                    )}

                    <ActionBar
                      suggestions={isDowned || isRollRequired ? [] : ((suggestionsByPup && suggestionsByPup[selectedChar.name]) || suggestions)}
                      onAction={handleAction}
                      characterName={selectedChar.name}
                      isThinking={isThinking}
                      disabled={!isMyTurn || isRollRequired}
                      placeholder={isRollRequired ? "🎲 Roll the D20 to resolve the action..." : undefined}
                    />
               </FrostContainer>
             </div>

             {/* Downed Overlay */}
             {isDowned && (
               <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center select-none rounded-xl border border-red-500/20">
                 <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 flex items-center justify-center mb-4 animate-pulse">
                   <Heart className="w-8 h-8 fill-current" />
                 </div>
                 <h2 className="text-2xl font-serif font-bold text-white mb-2">You Have Been Downed!</h2>
                 {isMultiplayer ? (
                   <p className="text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
                     You have run out of energy. Wait for a packmate to use their turn to revive you!
                   </p>
                 ) : (
                   <>
                     <p className="text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
                       The cold was too intense, and the pack had to turn back. Rest and try again!
                     </p>
                     <button
                       onClick={onRetryChapter}
                       className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-500/20 transition-all active:scale-95"
                     >
                       Retry Chapter
                     </button>
                   </>
                 )}
               </div>
             )}

             {/* Victory Overlay */}
             {gameStatus === 'ended' && (
               <div className="absolute inset-0 z-35 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center select-none rounded-xl border border-amber-500/20">
                 <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center mb-6 animate-bounce">
                   <Star className="w-10 h-10 fill-current" />
                 </div>
                 <h2 className="text-3xl font-serif font-extrabold text-amber-400 tracking-widest mb-2">PACK LEGEND</h2>
                 <p className="text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
                   You have successfully reached the Frost Crystal, ignited its light, and saved the Moonshine River Pack!
                 </p>
                 <div className="flex gap-4">
                   <button
                     onClick={onLeaveGame}
                     className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                   >
                     Play Again
                   </button>
                 </div>
               </div>
             )}

             {/* Finale Editor Overlay */}
             {showFinaleEditor && gameStatus !== 'ended' && (
               <div className="absolute inset-0 z-30 flex flex-col bg-slate-950/95 backdrop-blur-md p-6 select-none rounded-xl border border-indigo-500/30 overflow-y-auto">
                 <h2 className="text-xl font-serif font-extrabold text-indigo-300 tracking-wider text-center mb-1">
                   ✨ The Fate of Moonshine River ✨
                 </h2>
                 <p className="text-xs text-slate-400 text-center mb-6">
                   Select the path of the Frost Crystal and write your story's ending!
                 </p>

                 {/* Choices */}
                 <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                   <button
                     onClick={() => setFinaleChoice('light')}
                     className={`p-4 rounded-xl border text-center font-bold flex flex-col items-center gap-2 transition-all ${
                       finaleChoice === 'light'
                         ? 'border-amber-400 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                         : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                     }`}
                   >
                     <span className="text-2xl">☀️</span>
                     <span>Light Path</span>
                     <span className="text-[10px] font-normal text-slate-400">Restore the River</span>
                   </button>
                   <button
                     onClick={() => setFinaleChoice('dark')}
                     className={`p-4 rounded-xl border text-center font-bold flex flex-col items-center gap-2 transition-all ${
                       finaleChoice === 'dark'
                         ? 'border-purple-400 bg-purple-500/10 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                         : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                     }`}
                   >
                     <span className="text-2xl">🌙</span>
                     <span>Dark Path</span>
                     <span className="text-[10px] font-normal text-slate-400">Destroy the River</span>
                   </button>
                 </div>

                 {/* Textarea */}
                 {finaleChoice && (
                   <div className="flex-1 flex flex-col gap-2 min-h-[180px]">
                     <label className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                       CO-AUTHOR WORKSPACE: Write the final scene...
                     </label>
                     <textarea
                       value={endingText}
                       onChange={(e) => setEndingText(e.target.value)}
                       placeholder={
                         finaleChoice === 'light'
                           ? "Describe how Shiver and the pack ignite the crystal with light magic, purifying the Moonshine River..."
                           : "Describe how the crystal's dark energy collapses the poisoned river, breaking the old world to start anew..."
                       }
                       className="flex-1 w-full bg-slate-900/60 border border-white/10 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                     />
                     
                     <div className="flex justify-end gap-3 mt-4 shrink-0">
                       <button
                         onClick={() => {
                           setShowFinaleEditor(false);
                           setFinaleChoice(null);
                           setEndingText('');
                         }}
                         className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                       >
                         Cancel
                       </button>
                       <button
                         onClick={async () => {
                           if (!endingText.trim()) return;
                           const choiceName = finaleChoice === 'light' ? 'Light' : 'Dark';
                           
                           // Send message
                           await onSendMessage(`ignites the Frost Crystal with ${choiceName} magic!\n\n${endingText}`);
                           
                           // Trigger objective completion command
                           await onSendMessage('[[COMPLETE_OBJECTIVE: chapter_7]]');
                           
                           setShowFinaleEditor(false);
                           setFinaleChoice(null);
                           setEndingText('');
                         }}
                         disabled={!endingText.trim()}
                         className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                       >
                         Write Ending ✒️
                       </button>
                     </div>
                   </div>
                 )}
               </div>
             )}
          </main>

          {/* RIGHT COLUMN: Mobile Inventory / Extra Info (Optional, keeping simple for now) */}
          {/* Could be used for Party Status in future */}
        </div>
      </ScreenShake>

      {/* Overlays */}
      <Dice3D
        isRolling={showDice}
        onRollComplete={handleRollComplete}
        statAbbr={activeStatAbbr}
        modifier={activeModifier}
      />

      <MagicBurst trigger={magicTrigger} type={magicVfxType} />

      <BottomSheet
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`${selectedChar.name} - Pack Info`}
      >
        <CharacterSheet character={selectedChar} earnedBadges={localBadges} health={myHp} />
        <InventoryGrid items={localInventory} onItemSelect={(item) => setActiveItemToUse(item)} />
        <PartyStatus players={players} localPlayerCharName={selectedChar.name} />
      </BottomSheet>

      {activeItemToUse && (
        <ItemUseMenu
          item={activeItemToUse}
          onClose={() => setActiveItemToUse(null)}
          onUse={() => {
            if (onUseItem && isMyTurn) {
              onUseItem(selectedChar.name, activeItemToUse.id);
            }
          }}
          isDowned={isDowned}
          isRollRequired={isRollRequired}
          isMyTurn={isMyTurn}
          isSpectator={playerRole === 'spectator'}
        />
      )}

      {/* Spirit Collection Modal */}
      <SpiritCollection
        isOpen={showSpirits}
        onClose={() => setShowSpirits(false)}
        chapterId={chapterId}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* Rank Up Level Up Overlay */}
      {showLevelUpRank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <FrostContainer className="max-w-md w-full p-8 text-center relative border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-6 animate-bounce">
              <Sparkles className="w-10 h-10 fill-current" />
            </div>

            <h2 className="text-3xl font-serif font-extrabold text-amber-400 tracking-widest mb-1 animate-pulse">
              RANK UP!
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-4">
              You have grown stronger
            </p>
            
            <div className="text-base text-slate-200 mb-6 font-sans">
              Your dedication to the pack has earned you the rank of:
              <div className="text-2xl font-serif text-white font-bold mt-2 bg-white/5 border border-white/10 rounded-lg py-2 px-4 inline-block">
                ✨ {showLevelUpRank} ✨
              </div>
            </div>

            <button
              onClick={() => {
                setShowLevelUpRank(null);
                setMagicVfxType('crit_gold');
                setMagicTrigger(prev => prev + 1);
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 font-serif font-extrabold rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all active:scale-95"
            >
              Acknowledge Rank 🐾
            </button>
          </FrostContainer>
        </div>
      )}

      {/* Initiative Overlay */}
      {showInitiativeOverlay && (
        <InitiativeOverlay
          players={players}
          currentUserCharName={selectedChar.name}
          onRoll={(result) => {
            if (onInitiativeRoll) onInitiativeRoll(result);
          }}
          isSinglePlayer={players.length <= 1}
          phase={phase}
        />
      )}

      {/* Recap Modal */}
      {showRecapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(99,102,241,0.2)] text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600" />
            <h2 className="text-2xl font-serif font-bold text-white mb-2 tracking-wide">
              Previously on Husky's Snow...
            </h2>
            <p className="text-xs text-indigo-400 uppercase tracking-widest font-semibold mb-6">
              {chapterTitle}
            </p>
            
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar bg-slate-950/50 border border-white/5 rounded-xl p-4 mb-6 text-left text-sm leading-relaxed text-slate-300 italic font-serif">
              {loadingRecap ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-500 font-sans not-italic">Reading the snowy records...</span>
                </div>
              ) : (
                recapText || "The journey continues..."
              )}
            </div>

            <button
              onClick={() => {
                setShowRecapModal(false);
                if (gameId) {
                  sessionStorage.setItem(`husky-recap-shown-${gameId}`, 'true');
                }
              }}
              disabled={loadingRecap}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              Continue Adventure
            </button>
          </div>
        </div>
      )}

      {/* Episode Reflection Modal */}
      {showReflectionChapId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900/90 border border-rose-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(244,63,94,0.15)] text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
            <h2 className="text-2xl font-serif font-bold text-white mb-1 tracking-wide">
              Episode Complete!
            </h2>
            <p className="text-xs text-rose-400 uppercase tracking-widest font-semibold mb-6">
              Reflections on your journey
            </p>
            
            <div className="bg-slate-950/50 border border-white/5 rounded-xl p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">
                Pack Values Demonstrated:
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { name: 'courage', label: 'Courage 🦁', desc: 'Facing fears & taking risks' },
                  { name: 'empathy', label: 'Empathy 🤝', desc: 'Helping and comforting others' },
                  { name: 'teamwork', label: 'Teamwork 🐺', desc: 'Working together as one' },
                  { name: 'perseverance', label: 'Perseverance 🏔️', desc: 'Keeping on after failure' }
                ].map(v => {
                  const hasValue = getEpisodeReflection(showReflectionChapId).valuesShown[v.name as 'courage' | 'empathy' | 'teamwork' | 'perseverance'];
                  return (
                    <div 
                      key={v.name} 
                      className={`p-3 rounded-lg border transition-all ${
                        hasValue 
                          ? 'bg-rose-500/10 border-rose-500/30 text-white shadow-sm' 
                          : 'bg-slate-950/40 border-white/5 text-slate-500'
                      }`}
                    >
                      <div className="font-bold text-sm flex items-center gap-1.5">
                        <span className={hasValue ? 'scale-110' : 'opacity-40'}>
                          {hasValue ? '✅' : '⚫'}
                        </span>
                        {v.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{v.desc}</div>
                    </div>
                  );
                })}
              </div>

              <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Key moments:
              </h3>
              <div className="max-h-[120px] overflow-y-auto custom-scrollbar text-xs leading-relaxed text-slate-300 space-y-1.5">
                {getEpisodeReflection(showReflectionChapId).details.length > 0 ? (
                  getEpisodeReflection(showReflectionChapId).details.map((d, i) => (
                    <div key={i} className="flex gap-1">
                      <span className="text-rose-400">•</span>
                      <span>{d}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">No specific values logged, but the pack stayed warm and moved forward together.</p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setShowReflectionChapId(null);
              }}
              className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-lg shadow-rose-500/20 transition-all active:scale-95 animate-pulse"
            >
              Begin Next Episode
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
