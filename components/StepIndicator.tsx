import React from 'react';
import { CheckIcon } from './Icons';

interface StepIndicatorProps {
  currentStep: number;
}
const steps = [
  { id: 1, name: 'Start', description: 'Share your details.' },
  { id: 2, name: 'Product History', description: 'Tell us what you\'ve used.' },
  { id: 3, name: 'Skin Analysis', description: 'Upload photos for AI analysis.' },
  { id: 4, name: 'Your Goals', description: 'Select your desired outcomes.' },
  { id: 5, name: 'Your Product Plan', description: 'View and shop your products.' },
  { id: 6, name: 'AI Doctor\'s Report', description: 'Review your analysis summary.' },
  { id: 7, name: 'AI Assistant', description: 'Ask questions about your plan.' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="space-y-6">
                {steps.map((step, stepIdx) => (
                    <li key={step.name} className="relative">
                        {stepIdx !== steps.length - 1 ? (
                            <div
                                className={`absolute left-5 top-5 -ml-px mt-0.5 h-full w-0.5 ${step.id < currentStep ? 'bg-brand-primary-light' : 'bg-slate-300'}`}
                                aria-hidden="true"
                            />
                        ) : null}
                        <div className="relative flex items-start group">
                             <span className="h-10 w-10 flex items-center justify-center shrink-0" aria-hidden="true">
                                {step.id < currentStep ? (
                                    <div className="relative z-10 w-10 h-10 flex items-center justify-center bg-brand-primary-light rounded-full shadow-lg shadow-brand-primary-light/30">
                                        <CheckIcon className="w-6 h-6 text-white" aria-hidden="true" />
                                    </div>
                                ) : step.id === currentStep ? (
                                    <div className="relative z-10 w-10 h-10 flex items-center justify-center bg-white border-2 border-brand-primary-light rounded-full shadow-glow-primary animate-pulse-glow">
                                        <span className="h-4 w-4 bg-brand-primary-light rounded-full" />
                                    </div>
                                ) : (
                                    <div className="relative z-10 w-10 h-10 flex items-center justify-center bg-slate-200 border-2 border-slate-300 rounded-full">
                                        <span className="h-2.5 w-2.5 bg-slate-400 rounded-full" />
                                    </div>
                                )}
                            </span>
                            <span className="ml-4 min-w-0 flex flex-col pt-2">
                                <span className={`text-xs font-semibold tracking-wide ${step.id <= currentStep ? 'text-slate-800' : 'text-slate-500'}`}>
                                  {step.name}
                                </span>
                                <span className="text-[11px] text-slate-500">{step.description}</span>
                            </span>
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
};