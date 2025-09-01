import { useState, useEffect, useRef, useCallback } from 'react';

// FIX: Add type definitions for the Web Speech API to resolve TypeScript errors.
// These APIs are experimental and not always included in default DOM type declarations.
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

const isSpeechRecognitionSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
const SpeechRecognition = isSpeechRecognitionSupported ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(prev => prev + finalTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    }

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = useCallback((lang: 'en-US' | 'ar-SA' = 'en-US') => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.lang = lang;
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const speak = useCallback((text: string, lang: 'en-US' | 'ar-SA' = 'en-US', selectedVoice: SpeechSynthesisVoice | null = null) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Use the selected voice if provided.
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else {
            // Fallback to finding a voice by language if no specific voice is selected.
            const allVoices = speechSynthesis.getVoices();
            const voice = allVoices.find(v => v.lang.startsWith(lang));
            if (voice) {
                utterance.voice = voice;
            } else {
                console.warn(`Voice for lang '${lang}' not found. Using default.`);
            }
        }
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error("Speech synthesis error", e);
            setIsSpeaking(false);
        }
        speechSynthesis.speak(utterance);
    } else {
        console.warn("Speech synthesis not supported in this browser.");
    }
  }, []);

  const cancelSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);
  
  // Ensure voices are loaded and update state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        setVoices(speechSynthesis.getVoices());
      };
      speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices(); // Initial load
    }
  }, []);

  return { isListening, transcript, startListening, stopListening, isSpeaking, speak, cancelSpeaking, isSpeechSupported: isSpeechRecognitionSupported, voices };
};