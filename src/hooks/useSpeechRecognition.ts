import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AudioRecorder, blobToBase64 } from '@/utils/audioRecorder';

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<string>;
  setLanguage: (lang: string) => void;
}

// Get the Speech Recognition constructor from the window
function getSpeechRecognition(): (new () => any) | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function useSpeechRecognition({
  language = 'en-IN',
  continuous = true,
  interimResults = true,
  onResult,
  onError,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  
  const recognitionRef = useRef<any>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const transcriptResolverRef = useRef<((value: string) => void) | null>(null);
  const finalTranscriptRef = useRef('');
  
  // Check if Web Speech API is supported
  const isSupported = getSpeechRecognition() !== null;

  // Initialize Web Speech API
  const initWebSpeech = useCallback(() => {
    const SpeechRecognitionConstructor = getSpeechRecognition();
    if (!SpeechRecognitionConstructor) return null;
    
    const recognition = new SpeechRecognitionConstructor();
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = currentLanguage;
    
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      
      if (final) {
        finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + final;
        setTranscript(finalTranscriptRef.current);
        onResult?.(final, true);
      }
      
      setInterimTranscript(interim);
      if (interim) {
        onResult?.(interim, false);
      }
    };
    
    recognition.onerror = (event: any) => {
      // Ignore aborted errors (happens when we manually stop)
      if (event.error === 'aborted') return;
      
      const errorMsg = `Speech recognition error: ${event.error}`;
      setError(errorMsg);
      onError?.(errorMsg);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      
      // Resolve the promise with final transcript
      if (transcriptResolverRef.current) {
        transcriptResolverRef.current(finalTranscriptRef.current);
        transcriptResolverRef.current = null;
      }
    };
    
    return recognition;
  }, [continuous, interimResults, currentLanguage, onResult, onError]);

  // Fallback to edge function transcription
  const transcribeWithEdgeFunction = useCallback(async (): Promise<string> => {
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder();
    }
    
    try {
      const audioBlob = await audioRecorderRef.current.stop();
      const base64Audio = await blobToBase64(audioBlob);
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          audio: base64Audio,
          language: currentLanguage.split('-')[0], // Convert en-IN to en
        },
      });
      
      if (error) throw error;
      return data?.text || '';
    } catch (err: any) {
      const errorMsg = `Transcription error: ${err.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
      return '';
    }
  }, [currentLanguage, onError]);

  const startListening = useCallback(async () => {
    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    
    if (isSupported) {
      // CRITICAL: Start recognition synchronously to preserve gesture context
      // The async wrapper is fine, but recognition.start() must be called
      // synchronously in the same tick as the user gesture
      const recognition = initWebSpeech();
      if (recognition) {
        recognitionRef.current = recognition;
        try {
          recognitionRef.current.start(); // Synchronous call preserves gesture
          setIsListening(true);
          return; // Exit early on success
        } catch (err: any) {
          console.warn('Web Speech API failed to start:', err);
          // Fall through to audio recorder fallback
        }
      }
    }
    
    // Fallback: Use audio recorder for transcription via edge function
    // getUserMedia must be called immediately on user gesture
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder();
    }
    await audioRecorderRef.current.start();
    setIsListening(true);
  }, [isSupported, initWebSpeech]);

  const stopListening = useCallback(async (): Promise<string> => {
    return new Promise(async (resolve) => {
      if (recognitionRef.current) {
        // Store resolver for when onend fires
        transcriptResolverRef.current = resolve;
        recognitionRef.current.stop();
      } else if (audioRecorderRef.current?.isRecording()) {
        // Using fallback recording
        setIsListening(false);
        const transcribedText = await transcribeWithEdgeFunction();
        setTranscript(transcribedText);
        finalTranscriptRef.current = transcribedText;
        onResult?.(transcribedText, true);
        resolve(transcribedText);
      } else {
        setIsListening(false);
        resolve(finalTranscriptRef.current);
      }
    });
  }, [transcribeWithEdgeFunction, onResult]);

  const setLanguage = useCallback((lang: string) => {
    setCurrentLanguage(lang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    setLanguage,
  };
}
