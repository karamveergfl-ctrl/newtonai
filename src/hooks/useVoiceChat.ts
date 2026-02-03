import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useToast } from './use-toast';

interface UseVoiceChatOptions {
  documentId: string | null;
  sessionId: string | null;
  language?: string;
  onCitationFound?: (pageNumber: number, quote: string) => void;
  onTranscript?: (text: string) => void;
  onAnswer?: (text: string) => void;
}

interface UseVoiceChatReturn {
  // State
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  currentAnswer: string;
  error: string | null;
  voiceEnabled: boolean;
  
  // Actions
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  stopSpeaking: () => void;
  setLanguage: (lang: string) => void;
  toggleVoiceMode: () => void;
  replayLastAnswer: () => void;
}

// Extract page references from answer text
function extractPageReferences(text: string): Array<{ pageNumber: number; context: string }> {
  const pageRegex = /(?:page|pg\.?|p\.)\s*(\d+)/gi;
  const matches: Array<{ pageNumber: number; context: string }> = [];
  
  let match;
  while ((match = pageRegex.exec(text)) !== null) {
    const pageNumber = parseInt(match[1], 10);
    // Get surrounding context (50 chars before and after)
    const start = Math.max(0, match.index - 50);
    const end = Math.min(text.length, match.index + match[0].length + 50);
    const context = text.slice(start, end);
    
    matches.push({ pageNumber, context });
  }
  
  return matches;
}

// Clean text for TTS (remove markdown, special chars)
function cleanTextForTTS(text: string): string {
  return text
    // Remove markdown bold/italic
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.+?)`/g, '$1')
    // Remove bullet points
    .replace(/^[\\s]*[-*+]\\s+/gm, '')
    // Remove numbered lists
    .replace(/^[\\s]*\d+\.\s+/gm, '')
    // Remove links but keep text
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function useVoiceChat({
  documentId,
  sessionId,
  language = 'en-IN',
  onCitationFound,
  onTranscript,
  onAnswer,
}: UseVoiceChatOptions): UseVoiceChatReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const lastAnswerRef = useRef<string>('');
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);
  
  const { toast } = useToast();
  
  // Speech recognition hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    startListening: startSpeechRecognition,
    stopListening: stopSpeechRecognition,
    setLanguage: setSpeechLanguage,
  } = useSpeechRecognition({
    language: currentLanguage,
    continuous: false, // Stop after speech ends
    interimResults: true,
  });

  // Send transcript to RAG system and get answer
  const processVoiceQuery = useCallback(async (query: string) => {
    if (!documentId || !query.trim()) return;
    
    setIsProcessing(true);
    onTranscript?.(query);
    
    try {
      // Add to conversation history
      conversationHistoryRef.current.push({ role: 'user', content: query });
      
      // Call the RAG chat endpoint with voice mode flag
      const { data, error } = await supabase.functions.invoke('rag-chat-pdf', {
        body: {
          documentId,
          sessionId,
          question: query,
          conversationHistory: conversationHistoryRef.current.slice(-6),
          voiceMode: true, // Flag for TTS-optimized response
        },
      });
      
      if (error) throw error;
      
      const answer = data.answer || "I couldn't find an answer in your document.";
      setCurrentAnswer(answer);
      lastAnswerRef.current = answer;
      onAnswer?.(answer);
      
      // Add to conversation history
      conversationHistoryRef.current.push({ role: 'assistant', content: answer });
      
      // Extract and report citations
      if (data.citations && onCitationFound) {
        for (const citation of data.citations) {
          onCitationFound(citation.pageNumber, citation.quote);
        }
      }
      
      // Also extract page references from the answer text
      const pageRefs = extractPageReferences(answer);
      if (pageRefs.length > 0 && onCitationFound) {
        onCitationFound(pageRefs[0].pageNumber, pageRefs[0].context);
      }
      
      // Speak the answer if voice mode is enabled
      if (voiceEnabled) {
        await speakAnswer(answer);
      }
      
    } catch (err: any) {
      console.error('Voice chat error:', err);
      const errorMsg = "I'm sorry, I had trouble processing your question. Please try again.";
      setCurrentAnswer(errorMsg);
      
      if (voiceEnabled) {
        await speakAnswer(errorMsg);
      }
      
      toast({
        title: 'Error',
        description: err.message || 'Failed to process voice query',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [documentId, sessionId, voiceEnabled, onCitationFound, onTranscript, onAnswer, toast]);

  // Text-to-speech using ElevenLabs
  const speakAnswer = useCallback(async (text: string) => {
    // Clean text for TTS
    const cleanedText = cleanTextForTTS(text);
    
    try {
      setIsSpeaking(true);
      
      // Call voice-chat-tts edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-chat-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text: cleanedText,
            language: currentLanguage,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      
      // Clean up previous audio
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      audioUrlRef.current = URL.createObjectURL(audioBlob);
      
      // Create and play audio
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = audioUrlRef.current;
      audioRef.current.onended = () => setIsSpeaking(false);
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        // Fallback to Web Speech API
        fallbackSpeak(cleanedText);
      };
      
      await audioRef.current.play();
      
    } catch (err: any) {
      console.error('TTS error:', err);
      // Fallback to Web Speech API
      fallbackSpeak(cleanedText);
    }
  }, [currentLanguage]);

  // Fallback TTS using Web Speech API
  const fallbackSpeak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLanguage;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [currentLanguage]);

  // Start listening to user
  const startListening = useCallback(async () => {
    try {
      await startSpeechRecognition();
    } catch (err: any) {
      toast({
        title: 'Microphone Error',
        description: 'Please allow microphone access to use voice chat.',
        variant: 'destructive',
      });
    }
  }, [startSpeechRecognition, toast]);

  // Stop listening and process the query
  const stopListening = useCallback(async () => {
    const finalTranscript = await stopSpeechRecognition();
    
    if (finalTranscript.trim()) {
      await processVoiceQuery(finalTranscript);
    }
  }, [stopSpeechRecognition, processVoiceQuery]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // Toggle voice mode
  const toggleVoiceMode = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  // Replay last answer
  const replayLastAnswer = useCallback(() => {
    if (lastAnswerRef.current) {
      speakAnswer(lastAnswerRef.current);
    }
  }, [speakAnswer]);

  // Set language
  const setLanguage = useCallback((lang: string) => {
    setCurrentLanguage(lang);
    setSpeechLanguage(lang);
  }, [setSpeechLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    interimTranscript,
    currentAnswer,
    error: speechError,
    voiceEnabled,
    startListening,
    stopListening,
    stopSpeaking,
    setLanguage,
    toggleVoiceMode,
    replayLastAnswer,
  };
}
