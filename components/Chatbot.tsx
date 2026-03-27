import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { SkinConditionCategory, ChatMessage, SkincareRoutine } from '../types';
import Button from './common/Button';
import { BotMessageSquare, User } from './Icons';

interface ChatbotProps {
  analysisResult: SkinConditionCategory[] | null;
  skincareGoals: string[];
  recommendation: SkincareRoutine | null;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const Chatbot: React.FC<ChatbotProps> = ({ analysisResult, skincareGoals, recommendation, chatHistory, setChatHistory }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isChatInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatHistory]);
  
   useEffect(() => {
     if (chatHistory.length === 0 && !isChatInitialized.current) {
        const initialBotMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'ai',
            text: 'Hello! I\'m your AI Skincare Assistant. Do you have any questions about your new routine or skin analysis?'
        };
        setChatHistory([initialBotMessage]);
    }
  }, [chatHistory.length, setChatHistory]);
  
  const getSystemInstruction = useCallback(() => {
     if (!analysisResult || !recommendation) return '';
    const analysisString = analysisResult.map(cat => 
        `${cat.category}: ${cat.conditions.map(c => `${c.name} at ${c.location} (${c.confidence}% confidence)`).join(', ')}`
    ).join('; ');
    const goalsString = skincareGoals.join(', ');
    const recommendationString = `
    Introduction: ${recommendation.introduction}
    AM Routine: ${recommendation.am.map(s => `${s.productName} (${s.purpose})`).join(' -> ')}
    PM Routine: ${recommendation.pm.map(s => `${s.productName} (${s.purpose})`).join(' -> ')}
    Key Ingredients: ${recommendation.keyIngredients.join(', ')}
    Lifestyle Tips: ${recommendation.lifestyleTips.join(' ')}
    Disclaimer: ${recommendation.disclaimer}
    `;
    return `You are a friendly and knowledgeable skincare assistant for the brand "Dermatics India". The user has just received a skincare analysis and a routine composed of specific Dermatics India products.
    Their details are:
    - Skin Analysis: ${analysisString}
    - Skincare Goals: ${goalsString}
    - Recommended Routine: ${recommendationString}
    
    Your role is to answer their follow-up questions about their skin, the recommended routine, or specific Dermatics India products mentioned in their routine. 
    Be concise and helpful. Always encourage consulting a real dermatologist for medical advice or diagnosis. Do not give medical advice.`;
  }, [analysisResult, skincareGoals, recommendation]);

  const initializeAndSendMessage = async (message: string): Promise<void> => {
    const apiKeys = (process.env.API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
    if (apiKeys.length === 0) throw new Error("API keys not configured.");

    const systemInstruction = getSystemInstruction();
    let lastError: Error | null = null;
    
    for (const apiKey of apiKeys) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
            });
            
            // This is the first message, so we send it to test the connection and start the chat.
            const result = await chat.sendMessageStream({ message });
            
            // If we get here, the key is valid and the stream has started.
            chatRef.current = chat; // Store the successful chat session.
            isChatInitialized.current = true;
            await streamResponseToState(result); // Handle streaming the response.
            return; // Success, exit the function.

        } catch (error) {
            lastError = error as Error;
            console.warn('Chat initialization with an API key failed:', lastError.message);
        }
    }
    // If the loop finishes, all keys failed.
    if (lastError) throw lastError;
  };

  const streamResponseToState = async (resultStream: AsyncGenerator<any>) => {
      let text = '';
      const aiMessageId = (Date.now() + 1).toString();
      setChatHistory(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '...' }]);

      for await (const chunk of resultStream) {
        text += chunk.text;
        setChatHistory(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: text + '▌' } : msg
        ));
      }
      setChatHistory(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text } : msg
      ));
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input };
    setChatHistory(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
        if (!isChatInitialized.current || !chatRef.current) {
            // First message, needs to find a working key and initialize chat
            await initializeAndSendMessage(currentInput);
        } else {
            // Subsequent messages, use the existing chat session
            const result = await chatRef.current.sendMessageStream({ message: currentInput });
            await streamResponseToState(result);
        }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an error and couldn\'t connect to the AI assistant. Please try again.'
      };
      setChatHistory(prev => [...prev, errorMessage]);
      // Reset initialization status so it retries with all keys next time
      isChatInitialized.current = false;
      chatRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-grow overflow-y-auto p-4 bg-white rounded-lg border border-slate-200 shadow-inner-soft mb-4 flex flex-col space-y-4">
        {chatHistory.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : 'animate-fade-in-up'}`}>
            {message.sender === 'ai' && <div className="p-1.5 bg-slate-200 rounded-full mt-1 flex-shrink-0"><BotMessageSquare className="w-5 h-5 text-blue-600" /></div>}
            <div className={`rounded-xl px-4 py-2 max-w-md shadow-sm ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
              <p className="text-sm sm:text-base whitespace-pre-wrap">{message.text}</p>
            </div>
            {message.sender === 'user' && <div className="p-1.5 bg-slate-200 rounded-full mt-1 flex-shrink-0"><User className="w-5 h-5 text-slate-600" /></div>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-shrink-0 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about your routine..."
          className="flex-grow bg-white text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base shadow-sm"
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} isLoading={isLoading} size="sm">Send</Button>
      </div>
    </div>
  );
};

export default Chatbot;