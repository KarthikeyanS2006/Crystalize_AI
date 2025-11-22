import React from 'react';
import { Message, GroundingChunk } from '../types';
import { Bot, User, Sparkles, Globe, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
  onCrystallize: (text: string, id: string) => void;
  isCrystallizing: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onCrystallize, isCrystallizing }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex w-full mb-6 ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isModel ? 'bg-white dark:bg-slate-800 border border-brand-100 dark:border-slate-700 mr-3' : 'bg-brand-500 ml-3'}`}>
          {isModel ? <Bot size={20} className="text-brand-500" /> : <User size={20} className="text-white" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isModel ? 'items-start' : 'items-end'}`}>
          <div className={`relative px-5 py-4 rounded-2xl shadow-sm ${
            isModel 
              ? 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-100 rounded-tl-none' 
              : 'bg-brand-500 text-white rounded-tr-none'
          }`}>
            {message.isThinking ? (
               <div className="flex items-center space-x-2 text-brand-500">
                 <Loader2 className="animate-spin" size={16} />
                 <span className="text-sm font-medium">Analyzing the web...</span>
               </div>
            ) : (
              <div className={`prose prose-sm max-w-none ${
                isModel 
                  ? 'prose-headings:text-gray-800 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-strong:text-gray-900 dark:prose-strong:text-white prose-a:text-brand-600 dark:prose-a:text-brand-400' 
                  : 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-a:text-white'
              }`}>
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Actions & Metadata (Only for Model) */}
          {isModel && !message.isThinking && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              
              {/* Grounding Sources */}
              {message.groundingChunks && message.groundingChunks.length > 0 && (
                <div className="flex flex-wrap gap-2 mr-2">
                  {message.groundingChunks.map((chunk, i) => (
                    chunk.web?.uri && (
                      <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center px-2 py-1 text-xs bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-slate-700 border border-blue-100 dark:border-slate-600 transition-colors"
                      >
                        <Globe size={10} className="mr-1" />
                        {chunk.web.title || new URL(chunk.web.uri).hostname}
                      </a>
                    )
                  ))}
                </div>
              )}

              {/* Crystallize Action */}
              <button 
                onClick={() => onCrystallize(message.text, message.id)}
                disabled={isCrystallizing}
                className="flex items-center px-3 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
              >
                {isCrystallizing ? (
                   <Loader2 size={12} className="mr-1 animate-spin" />
                ) : (
                   <Sparkles size={12} className="mr-1" />
                )}
                Crystallize Insight
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};