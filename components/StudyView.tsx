import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSpeech } from '../hooks/useSpeech';
import { getTafsir } from '../services/geminiService';
import { IconButton, MicIcon, SpeakerIcon, StopIcon, SendIcon } from './common/IconButton';

type Message = {
  id: number;
  role: 'user' | 'ai' | 'loading' | 'error';
  content: string;
};

// Chat Bubble Component
const ChatBubble: React.FC<{ message: Message, onSpeak: () => void, isSpeaking: boolean }> = ({ message, onSpeak, isSpeaking }) => {
  const isAi = message.role === 'ai' || message.role === 'loading' || message.role === 'error';
  
  const bubbleClasses = isAi
    ? 'bg-white text-stone-800 rounded-b-xl rounded-tr-xl'
    : 'bg-islamic-green-light bg-opacity-20 text-islamic-green-dark rounded-b-xl rounded-tl-xl';
  
  const wrapperClasses = `flex items-end gap-2 ${isAi ? 'justify-start' : 'justify-end'}`;

  const AiIcon = () => (
    <div className="w-8 h-8 rounded-full bg-islamic-green flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
      AI
    </div>
  );
  
  const Content = () => {
    switch (message.role) {
      case 'loading':
        return (
          <div className="flex items-center space-x-1 p-3">
            <span className="w-2 h-2 bg-stone-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-stone-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-stone-400 rounded-full animate-pulse"></span>
          </div>
        );
      case 'error':
        return <p className="text-red-600 p-3">{message.content}</p>;
      default:
        // FIX: The `className` prop is not valid on `ReactMarkdown`. Wrap it in a `div` to apply styles.
        return (
          <div className="prose prose-stone max-w-none p-3">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        );
    }
  };

  return (
    <div className={wrapperClasses}>
      {isAi && <AiIcon />}
      <div className={`max-w-xl shadow-sm ${bubbleClasses}`}>
        <Content />
      </div>
       {message.role === 'ai' && message.content && (
        <IconButton onClick={onSpeak} aria-label={isSpeaking ? 'Stop speaking' : 'Read explanation'}>
            {isSpeaking ? <StopIcon className="w-5 h-5 text-red-500" /> : <SpeakerIcon className="w-5 h-5 text-stone-500" />}
        </IconButton>
      )}
    </div>
  );
};

// Main Study View
const StudyView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);

  const { isListening, transcript, startListening, stopListening, isSpeaking, speak, cancelSpeaking, isSpeechSupported, voices } = useSpeech();
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const englishVoices = useMemo(() => voices.filter(v => v.lang.startsWith('en-')), [voices]);

  // Set initial message
  useEffect(() => {
    setMessages([
      { id: Date.now(), role: 'ai', content: "As-salamu alaykum! I am your Islamic Study Companion. How can I help you explore the Quran and Hadith today?" }
    ]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Update query from speech transcript
  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
    }
  }, [transcript]);

  // Handle speaker state
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageId(null);
    }
  }, [isSpeaking]);
  
  // Set a default voice when the component mounts or when voices load
  useEffect(() => {
    if (englishVoices.length > 0 && !selectedVoice) {
      setSelectedVoice(englishVoices[0]);
    }
  }, [englishVoices, selectedVoice]);

  const handleQuery = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now(), role: 'user', content: query };
    const loadingMessage: Message = { id: Date.now() + 1, role: 'loading', content: '' };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await getTafsir(userMessage.content);
      const aiMessage: Message = { id: loadingMessage.id, role: 'ai', content: response };
      setMessages(prev => prev.map(m => m.id === loadingMessage.id ? aiMessage : m));
    } catch (err: any) {
      const errorMessage: Message = { id: loadingMessage.id, role: 'error', content: err.message || 'An unexpected error occurred.' };
      setMessages(prev => prev.map(m => m.id === loadingMessage.id ? errorMessage : m));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setQuery('');
      startListening('en-US');
    }
  };
  
  const handleSpeakClick = (message: Message) => {
    if (isSpeaking && speakingMessageId === message.id) {
        cancelSpeaking();
        setSpeakingMessageId(null);
    } else if (message.content) {
        speak(message.content, 'en-US', selectedVoice);
        setSpeakingMessageId(message.id);
    }
  }
  
  const hasAiMessages = messages.some(m => m.role === 'ai');

  return (
    <div className="flex flex-col h-full bg-cream/50 backdrop-blur-sm border border-stone-200/80 rounded-xl shadow-lg">
      {/* Chat Messages */}
      <div className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto">
        {messages.map((msg) => (
          <ChatBubble 
            key={msg.id} 
            message={msg}
            onSpeak={() => handleSpeakClick(msg)}
            isSpeaking={isSpeaking && speakingMessageId === msg.id}
          />
        ))}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="flex-shrink-0 p-2 md:p-4 bg-white/70 border-t border-stone-200/80 rounded-b-xl">
        {hasAiMessages && englishVoices.length > 0 && (
          <div className="mb-3">
            <label htmlFor="voice-select" className="text-sm font-medium text-stone-600">AI Voice:</label>
            <select
              id="voice-select"
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const voice = englishVoices.find(v => v.name === e.target.value) || null;
                setSelectedVoice(voice);
              }}
              className="mt-1 w-full p-2 bg-stone-50 border border-stone-300 rounded-lg focus:border-islamic-green focus:ring-1 focus:ring-islamic-green transition"
            >
              {englishVoices.map(voice => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
        )}
        <form onSubmit={handleQuery} className="flex items-center space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? 'Listening...' : "Ask a question..."}
            className="w-full p-3 bg-stone-100 text-stone-800 rounded-lg border border-stone-300 focus:border-islamic-green focus:ring-1 focus:ring-islamic-green focus:outline-none transition"
            disabled={isLoading}
          />
          {isSpeechSupported && (
            <IconButton onClick={handleMicClick} disabled={isLoading} aria-label={isListening ? 'Stop listening' : 'Start listening'}>
              <MicIcon className={`w-6 h-6 ${isListening ? 'text-red-500' : ''}`} />
            </IconButton>
          )}
          <IconButton type="submit" disabled={isLoading || !query.trim()} variant="primary" aria-label="Send message">
            <SendIcon className="w-6 h-6" />
          </IconButton>
        </form>
      </div>
    </div>
  );
};

export default StudyView;