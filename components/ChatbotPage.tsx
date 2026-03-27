import React from 'react';
import { SkinConditionCategory, ChatMessage, SkincareRoutine } from '../types';
import Button from './common/Button';
import Chatbot from './Chatbot';
import { ArrowLeftIcon, RefreshCw } from './Icons';

interface ChatbotPageProps {
  onBack: () => void;
  onReset: () => void;
  analysisResult: SkinConditionCategory[] | null;
  skincareGoals: string[];
  recommendation: SkincareRoutine | null;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const ChatbotPage: React.FC<ChatbotPageProps> = ({
  onBack,
  onReset,
  analysisResult,
  skincareGoals,
  recommendation,
  chatHistory,
  setChatHistory,
}) => {
  return (
    <div className="animate-fade-in-up h-full flex flex-col w-full pb-4">
      <div className="flex-shrink-0">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
          <span className="text-brand-primary">Step 6:</span> AI Assistant
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mb-2">
          Have questions about your new routine? Ask our AI assistant for more details about the products or why they were chosen for you.
        </p>
      </div>

      <div className="flex-grow min-h-0">
        <Chatbot
          analysisResult={analysisResult}
          skincareGoals={skincareGoals}
          recommendation={recommendation}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
        />
      </div>

      <div className="flex-shrink-0 flex flex-wrap justify-center sm:justify-between items-center pt-2 border-t border-slate-200 gap-2">
        <Button onClick={onBack} variant="secondary" size="sm" className="gap-2">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Report
        </Button>
        <Button onClick={onReset} variant="secondary" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4"/>
          Start Over
        </Button>
      </div>
    </div>
  );
};

export default ChatbotPage;