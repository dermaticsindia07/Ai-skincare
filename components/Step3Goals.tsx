import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { PastProduct, SkinConditionCategory, SkincareRoutine } from '../types';
import Button from './common/Button';
import { SKINCARE_GOALS, LOADING_TIPS, LOADING_TIP_STYLES, CATEGORY_STYLES } from '../constants';
import { generateRoutine } from '../services/geminiService';
import { CheckIcon, SparklesIcon } from './Icons';

interface Step3Props {
  onBack: () => void;
  analysisResult: SkinConditionCategory[] | null;
  skincareGoals: string[];
  setSkincareGoals: (goals: string[]) => void;
  pastProducts: PastProduct[];
  setRecommendation: (rec: SkincareRoutine) => void;
  setRoutineTitle: (title: string) => void;
  setStep: (step: number) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}

const EXTENDED_LOADING_TIPS: string[] = [
    "This is taking a bit longer than usual, but we want to get it just right for you.",
    "Analyzing thousands of product combinations to find your perfect match.",
    "Cross-referencing ingredients against your unique skin analysis for maximum effectiveness.",
    "Thanks for your patience! We're putting the final touches on your personalized plan."
];

interface LoadingOverlayProps {
  tips: string[];
  title: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ tips, title }) => {
  const [currentTips, setCurrentTips] = useState(tips);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [countdown, setCountdown] = useState(60);
  const [isExtendedWait, setIsExtendedWait] = useState(false);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % (currentTips.length || 1));
    }, 4000);
    
    // FIX: Replaced NodeJS.Timeout with a browser-compatible timer handle type as NodeJS types are not available in this context.
    let countdownInterval: ReturnType<typeof setInterval> | undefined;
    if (!isExtendedWait) {
        countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setIsExtendedWait(true);
                    setCurrentTips(EXTENDED_LOADING_TIPS);
                    setCurrentTipIndex(0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    return () => {
      clearInterval(tipInterval);
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [currentTips.length, isExtendedWait]);

  const currentTip = currentTips[currentTipIndex];
  const currentStyle = LOADING_TIP_STYLES[currentTipIndex % LOADING_TIP_STYLES.length];
  const Icon = currentStyle.Icon;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 text-center max-w-md w-full mx-4 flex flex-col items-center">
        <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                {!isExtendedWait ? (
                    <span className="text-base font-bold text-brand-primary tabular-nums">{countdown}s</span>
                ) : (
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping"></div>
                )}
            </div>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mt-5">
            {isExtendedWait ? "Putting on the final touches..." : title}
        </h2>
        <div className="w-full mt-4 min-h-[80px]">
           <div
              key={currentTipIndex + (isExtendedWait ? 'ext' : 'reg')}
              className={`p-3 rounded-lg border flex items-start gap-3 animate-fade-in-up ${currentStyle.bg}`}
            >
              <Icon className={`w-6 h-6 flex-shrink-0 ${currentStyle.iconColor}`} />
              <div className={`${currentStyle.text} text-left text-xs`}>
                <strong className="block font-semibold">Helpful Tip</strong>
                <p>{currentTip}</p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};


const Step3Goals: React.FC<Step3Props> = ({
  onBack, analysisResult, skincareGoals, setSkincareGoals, pastProducts,
  setRecommendation, setRoutineTitle, setStep, setIsLoading, isLoading
}) => {
  const [customGoal, setCustomGoal] = useState('');

  const getGoalStyle = (goal) => {
    if (goal.relatedConditions.length > 0) {
        const category = goal.relatedConditions[0];
        if (CATEGORY_STYLES[category]) {
            return CATEGORY_STYLES[category];
        }
    }
    return CATEGORY_STYLES['Default'];
  };

  const suggestedGoals = useMemo(() => {
    if (!analysisResult) return new Set();
    const detectedCategories = new Set(analysisResult.map(ar => ar.category));
    const suggestions = new Set<string>();
    SKINCARE_GOALS.forEach(goal => {
      if (goal.relatedConditions.some(rc => detectedCategories.has(rc))) {
        suggestions.add(goal.id);
      }
    });
    return suggestions;
  }, [analysisResult]);

  const handleGoalToggle = (goalId: string) => {
    const isNoneSelected = goalId === 'none';
    const wasNoneSelected = skincareGoals.includes('none');

    if (isNoneSelected) {
      // If "None" is clicked, it becomes the only selection or it clears the selection.
      setSkincareGoals(wasNoneSelected ? [] : ['none']);
    } else {
      // If another goal is clicked, ensure "None" is not selected, and toggle the clicked goal.
      const otherGoals = skincareGoals.filter(g => g !== 'none');
      if (otherGoals.includes(goalId)) {
        // Deselect
        setSkincareGoals(otherGoals.filter(g => g !== goalId));
      } else {
        // Select
        setSkincareGoals([...otherGoals, goalId]);
      }
    }
  };

  const handleGenerateRoutine = useCallback(async () => {
    const goalsForApi = skincareGoals
      .map(id => {
        if (id === 'other') {
          return customGoal.trim();
        }
        if (id === 'none') {
            return null;
        }
        return SKINCARE_GOALS.find(g => g.id === id)?.label || null;
      })
      .filter((g): g is string => !!g);

    if (!analysisResult) {
        alert("Analysis results are missing. Please go back a step.");
        return;
    }
    
    // The `isGenerateDisabled` logic on the button prevents this from being called in an invalid state,
    // so we don't need to add extra alerts here for empty goals.

    setIsLoading(true);
    try {
      const { recommendation, title } = await generateRoutine(pastProducts, analysisResult, goalsForApi);
      setRecommendation(recommendation);
      setRoutineTitle(title);
      setStep(5); // Navigate to Report (now step 5 after adding Start page)
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [analysisResult, skincareGoals, customGoal, pastProducts, setRecommendation, setRoutineTitle, setStep, setIsLoading]);

  const isGenerateDisabled = skincareGoals.length === 0 || isLoading || (skincareGoals.includes('other') && !customGoal.trim());

  return (
     <>
        {isLoading && <LoadingOverlay title="Crafting your personalized plan..." tips={LOADING_TIPS} />}
        <div className="animate-fade-in-up h-full flex flex-col w-full pb-4">
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
                        <span className="text-brand-primary">Step 3:</span> Select Your Skincare Goals
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 mb-1">Choose what you'd like to focus on. We've highlighted some suggestions based on your skin analysis.</p>
                    <div className="flex items-center gap-2 text-xs text-green-700 mb-3">
                      <span className="inline-flex items-center justify-center p-1 bg-amber-300 rounded-full border border-amber-400">
                        <SparklesIcon className="w-3.5 h-3.5 text-amber-800" />
                      </span>
                      <span className="font-semibold">Suggestion</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {SKINCARE_GOALS.map(goal => {
                        const isSelected = skincareGoals.includes(goal.id);
                        const isSuggested = suggestedGoals.has(goal.id);
                        const Icon = goal.icon;
                        const style = getGoalStyle(goal);
                        return (
                        <div
                            key={goal.id}
                            onClick={() => handleGoalToggle(goal.id)}
                            className={`p-2 rounded-xl border-2 cursor-pointer transition-all duration-200 relative flex flex-col items-center justify-center text-center h-20 group hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 ${
                            isSelected 
                                ? 'border-blue-500 bg-blue-50/80 shadow-lg shadow-blue-500/20' 
                                : `${style.tailwind.border} bg-white/50`
                            }`}
                        >
                            <Icon className={`w-6 h-6 mb-0.5 transition-colors duration-200 ${isSelected 
                                ? 'text-blue-500' 
                                : `${style.tailwind.icon} group-hover:text-blue-500`
                            }`} />
                            <h4 className={`text-[11px] leading-tight sm:text-xs font-bold transition-colors duration-200 ${isSelected ? 'text-slate-800' : 'text-slate-600 group-hover:text-slate-800'}`}>{goal.label}</h4>
                            {isSuggested && !isSelected && (
                                <div className="absolute top-1.5 right-1.5 p-1 bg-amber-300 rounded-full shadow-sm group-hover:bg-amber-400 transition-colors" title="Suggested based on your analysis">
                                    <SparklesIcon className="w-4 h-4 text-amber-800" />
                                </div>
                            )}
                            {isSelected && (
                            <div className="absolute top-1.5 right-1.5 h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                <CheckIcon className="h-3.5 w-3.5 text-white" strokeWidth={3}/>
                            </div>
                            )}
                        </div>
                        );
                    })}
                    </div>
                    {skincareGoals.includes('other') && (
                        <div className="mt-6 animate-fade-in-up">
                            <label htmlFor="custom-goal-input" className="block text-sm sm:text-base font-semibold text-brand-text-main mb-2">
                                Please specify your goal:
                            </label>
                            <input
                                id="custom-goal-input"
                                type="text"
                                value={customGoal}
                                onChange={(e) => setCustomGoal(e.target.value)}
                                className="block w-full bg-white text-brand-text-main placeholder-slate-400 border border-slate-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-brand-primary-light focus:border-brand-primary-light transition-all text-base shadow-sm"
                                placeholder="e.g., Reduce under-eye puffiness"
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-shrink-0 flex justify-between pt-2 border-t border-slate-200">
                <Button onClick={onBack} variant="secondary" size="sm" disabled={isLoading}>Back</Button>
                <Button onClick={handleGenerateRoutine} disabled={isGenerateDisabled} size="sm">
                {isLoading ? 'Generating...' : 'Generate My Plan'}
                </Button>
            </div>
        </div>
    </>
  );
};

export default Step3Goals;