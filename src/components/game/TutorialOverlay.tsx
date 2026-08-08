import React, { useState } from 'react';
import { FrostContainer } from '../ui/FrostContainer';
import { ArrowRight, Dice5, HelpCircle, Star, Sparkles } from 'lucide-react';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState(0);
  const [practiceRoll, setPracticeRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const handlePracticeRoll = () => {
    setIsRolling(true);
    setPracticeRoll(null);
    setTimeout(() => {
      const result = Math.floor(Math.random() * 20) + 1;
      setPracticeRoll(result);
      setIsRolling(false);
    }, 1000);
  };

  const steps = [
    {
      title: "Welcome to Moonshine River",
      content: (
        <div className="flex flex-col gap-4 items-center text-center">
          <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
          <p className="text-sm leading-relaxed text-slate-300">
            You are about to play as a trainee pup in the Moonshine River Pack!
            Your goal is to work together with your packmates to find the ancient Frost Crystal and save your home from a mysterious frozen plague.
          </p>
        </div>
      ),
    },
    {
      title: "Stats & D20 Checks",
      content: (
        <div className="flex flex-col gap-4 text-center">
          <HelpCircle className="w-12 h-12 text-teal-400 mx-auto" />
          <p className="text-sm leading-relaxed text-slate-300">
            Every pup has <b>Strength</b>, <b>Agility</b>, <b>Smart</b>, and <b>Spirit</b>.
            When Quinn asks for a check, roll the D20. Your best stats add a bigger bonus automatically.
          </p>
        </div>
      ),
    },
    {
      title: "Cooperative Magic & Items",
      content: (
        <div className="flex flex-col gap-4 text-center">
          <Star className="w-12 h-12 text-amber-400 mx-auto animate-spin-slow" />
          <p className="text-sm leading-relaxed text-slate-300">
            Every pup starts with signature gear and can cast one <b>Spirit Surge</b> per chapter.
            During a hard check, magic or matching gear can replace the roll and move the story forward.
            You can also find supplies, weapons, and healing items along the trail.
          </p>
        </div>
      ),
    },
    {
      title: "Practice Roll!",
      content: (
        <div className="flex flex-col gap-4 items-center text-center">
          <div className={`text-4xl ${isRolling ? 'animate-spin' : ''}`}>
            🎲
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            Let's try a practice roll! Click the button below to roll a D20.
          </p>

          {practiceRoll !== null && (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 w-full animate-fade-in-up">
              <div className="text-2xl font-bold font-serif text-white">
                You Rolled: {practiceRoll}
              </div>
              <div className="text-xs font-mono text-indigo-300 mt-1">
                {practiceRoll === 20 ? (
                  <span className="text-amber-400 font-extrabold">🌟 Critical Success! 🌟</span>
                ) : practiceRoll === 1 ? (
                  <span className="text-rose-400 font-extrabold">⚠️ Critical Fail! ⚠️</span>
                ) : practiceRoll > 15 ? (
                  <span className="text-emerald-400">Critical Success!</span>
                ) : practiceRoll > 10 ? (
                  <span className="text-sky-300">Success!</span>
                ) : (
                  <span className="text-slate-400">Low roll — the story continues with a twist.</span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handlePracticeRoll}
            disabled={isRolling}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Dice5 className="w-4 h-4" />
            {isRolling ? "Rolling..." : "Roll Practice Dice"}
          </button>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      localStorage.setItem('husky-snow-tutorial-completed', 'true');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <FrostContainer className="max-w-md w-full p-6 relative animate-fade-in-up flex flex-col justify-between min-h-[350px]">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="font-serif text-lg text-white font-extrabold tracking-wider">
            {currentStep.title}
          </h2>
          <div className="flex justify-center gap-1 mt-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === step ? 'w-6 bg-indigo-400' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center py-4">
          {currentStep.content}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-6 border-t border-white/5 pt-4">
          <button
            onClick={() => {
              localStorage.setItem('husky-snow-tutorial-completed', 'true');
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Skip Tutorial
          </button>
          
          <button
            onClick={handleNext}
            disabled={step === steps.length - 1 && practiceRoll === null}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg text-sm text-white font-serif font-bold flex items-center gap-1.5 transition-all"
          >
            {step === steps.length - 1 ? "Start Adventure" : "Next"}
            {step < steps.length - 1 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </FrostContainer>
    </div>
  );
};
