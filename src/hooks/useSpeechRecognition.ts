import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AudioRecorder, blobToBase64 } from '@/utils/audioRecorder';

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onAutoStop?: (transcript: string) => void; // Called when auto-stopped due to silence
  silenceTimeout?: number; // ms before auto-stop (default 2000)
  maxListeningTime?: number; // ms max recording time (default 10000)
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
  onAutoStop,
  silenceTimeout = 2000,
  maxListeningTime = 10000,
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
  const pendingInterimRef = useRef(''); // Fallback for uncommitted interim results
  const isIntentionallyListeningRef = useRef(false);
  const manualStopRef = useRef(false);
  
  // Silence detection refs
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if Web Speech API is supported
  const isSupported = getSpeechRecognition() !== null;

  // Clean up timers
  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxTimeTimerRef.current) {
      clearTimeout(maxTimeTimerRef.current);
      maxTimeTimerRef.current = null;
    }
  }, []);

  // Auto-stop function
  const autoStopListening = useCallback(async () => {
    if (!isIntentionallyListeningRef.current) return;
    
    isIntentionallyListeningRef.current = false;
    manualStopRef.current = true;
    clearTimers();
    
    // Force commit pending interim if final is empty
    if (!finalTranscriptRef.current && pendingInterimRef.current) {
      finalTranscriptRef.current = pendingInterimRef.current;
      setTranscript(finalTranscriptRef.current);
    }
    
    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
    
    if (audioRecorderRef.current?.isRecording()) {
      setIsListening(false);
      try {
        const audioBlob = await audioRecorderRef.current.stop();
        const base64Audio = await blobToBase64(audioBlob);
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { 
            audio: base64Audio,
            language: currentLanguage.split('-')[0],
          },
        });
        
        if (!error && data?.text) {
          finalTranscriptRef.current = data.text;
          setTranscript(data.text);
        }
      } catch (err) {
        console.error('Transcription error:', err);
      }
    }
    
    setIsListening(false);
    setInterimTranscript('');
    
    // Notify parent via callback
    const finalText = finalTranscriptRef.current;
    onAutoStop?.(finalText);
    
    // Resolve any pending promise
    if (transcriptResolverRef.current) {
      transcriptResolverRef.current(finalText);
      transcriptResolverRef.current = null;
    }
  }, [clearTimers, currentLanguage, onAutoStop]);

  // Initialize Web Speech API
  const initWebSpeech = useCallback(() => {
    const SpeechRecognitionConstructor = getSpeechRecognition();
    if (!SpeechRecognitionConstructor) return null;
    
    const recognition = new SpeechRecognitionConstructor();
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = currentLanguage;
    
    recognition.onresult = (event: any) => {
      // Track last speech time for silence detection
      lastSpeechTimeRef.current = Date.now();
      
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
        pendingInterimRef.current = ''; // Clear pending since we got final
        onResult?.(final, true);
      }
      
      // Save interim as pending fallback
      if (interim) {
        pendingInterimRef.current = interim;
        setInterimTranscript(interim);
        onResult?.(interim, false);
      }
    };
    
    recognition.onerror = (event: any) => {
      // Ignore aborted errors (happens when we manually stop)
      if (event.error === 'aborted') return;
      
      // no-speech is normal - will auto-restart via onend
      if (event.error === 'no-speech') {
        return;
      }
      
      const errorMsg = `Speech recognition error: ${event.error}`;
      setError(errorMsg);
      onError?.(errorMsg);
    };
    
    recognition.onend = () => {
      setInterimTranscript('');
      
      // Auto-restart if user is still intending to listen (not manually stopped)
      if (isIntentionallyListeningRef.current && !manualStopRef.current) {
        try {
          recognition.start();
          return; // Don't set isListening to false, we're still listening
        } catch (e) {
          console.warn('Could not auto-restart recognition:', e);
        }
      }
      
      setIsListening(false);
      
      // Resolve the promise with final transcript
      if (transcriptResolverRef.current) {
        // Use pending interim as fallback if no final
        const result = finalTranscriptRef.current || pendingInterimRef.current;
        transcriptResolverRef.current(result);
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
    pendingInterimRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    isIntentionallyListeningRef.current = true;
    manualStopRef.current = false;
    lastSpeechTimeRef.current = Date.now();
    
    // Start silence detection timer
    clearTimers();
    silenceTimerRef.current = setInterval(() => {
      const silenceDuration = Date.now() - lastSpeechTimeRef.current;
      if (silenceDuration > silenceTimeout && isIntentionallyListeningRef.current) {
        autoStopListening();
      }
    }, 500);
    
    // Start max listening time timer
    maxTimeTimerRef.current = setTimeout(() => {
      if (isIntentionallyListeningRef.current) {
        autoStopListening();
      }
    }, maxListeningTime);
    
    if (isSupported) {
      // CRITICAL: Start recognition synchronously to preserve gesture context
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
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder();
    }
    await audioRecorderRef.current.start();
    setIsListening(true);
  }, [isSupported, initWebSpeech, clearTimers, silenceTimeout, maxListeningTime, autoStopListening]);

  const stopListening = useCallback(async (): Promise<string> => {
    // Mark that user intentionally stopped
    isIntentionallyListeningRef.current = false;
    manualStopRef.current = true;
    clearTimers();
    
    // Force commit pending interim if final is empty
    if (!finalTranscriptRef.current && pendingInterimRef.current) {
      finalTranscriptRef.current = pendingInterimRef.current;
      setTranscript(finalTranscriptRef.current);
    }
    
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
  }, [transcribeWithEdgeFunction, onResult, clearTimers]);

  const setLanguage = useCallback((lang: string) => {
    setCurrentLanguage(lang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [clearTimers]);

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
