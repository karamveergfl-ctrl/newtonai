import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Languages, RotateCcw } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { VoiceWaveform } from './VoiceWaveform';
import { SpeakingIndicator } from './SpeakingIndicator';
import { LottieNewton } from '@/components/newton/LottieNewton';
import { cn } from '@/lib/utils';

interface VoiceChatInterfaceProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  currentAnswer: string;
  voiceEnabled: boolean;
  error: string | null;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onToggleVoice: () => void;
  onReplay: () => void;
  onLanguageChange: (lang: string) => void;
  onCitationClick?: (pageNumber: number) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', name: 'English (India)' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'gu-IN', name: 'Gujarati' },
];

export function VoiceChatInterface({
  isListening,
  isSpeaking,
  isProcessing,
  transcript,
  interimTranscript,
  currentAnswer,
  voiceEnabled,
  error,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onToggleVoice,
  onReplay,
  onLanguageChange,
  onCitationClick,
}: VoiceChatInterfaceProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    onLanguageChange(code);
  };

  const handleMicClick = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  // Extract page numbers from answer for quick navigation
  const extractPageNumbers = (text: string): number[] => {
    const pageRegex = /(?:page|pg\.?|p\.)\s*(\d+)/gi;
    const pages: number[] = [];
    let match;
    while ((match = pageRegex.exec(text)) !== null) {
      const pageNum = parseInt(match[1], 10);
      if (!pages.includes(pageNum)) {
        pages.push(pageNum);
      }
    }
    return pages;
  };

  const citedPages = currentAnswer ? extractPageNumbers(currentAnswer) : [];

  // Determine Newton's state
  const getNewtonState = () => {
    if (isListening) return 'thinking';
    if (isProcessing) return 'thinking';
    if (isSpeaking) return 'celebrating';
    return 'idle';
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      {/* Newton Avatar */}
      <div className="relative">
        <LottieNewton state={getNewtonState()} size="lg" />
        
        {/* Waveform overlay when active */}
        {(isListening || isSpeaking) && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <VoiceWaveform 
              isActive={true} 
              type={isListening ? 'listening' : 'speaking'} 
              className="w-20"
            />
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="text-center min-h-[24px]">
        {isListening && (
          <p className="text-sm text-primary animate-pulse">Listening...</p>
        )}
        {isProcessing && (
          <p className="text-sm text-muted-foreground">Processing your question...</p>
        )}
        {isSpeaking && (
          <p className="text-sm text-green-600 dark:text-green-400">Speaking...</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Transcript display */}
      {(transcript || interimTranscript) && (
        <div className="w-full max-w-md p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">You said:</p>
          <p className="text-sm">
            {transcript}
            {interimTranscript && (
              <span className="text-muted-foreground italic"> {interimTranscript}</span>
            )}
          </p>
        </div>
      )}

      {/* Current answer preview */}
      {currentAnswer && !isProcessing && (
        <div className="w-full max-w-md p-3 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Answer:</p>
              <p className="text-sm line-clamp-3">{currentAnswer}</p>
            </div>
            {!isSpeaking && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReplay}
                className="shrink-0"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Replay
              </Button>
            )}
          </div>
          
          {/* Cited pages */}
          {citedPages.length > 0 && onCitationClick && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Pages:</span>
              {citedPages.map(page => (
                <Button
                  key={page}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onCitationClick(page)}
                >
                  Page {page}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Speaking indicator */}
      <SpeakingIndicator 
        isSpeaking={isSpeaking} 
        onStop={onStopSpeaking}
      />

      {/* Main mic button */}
      <Button
        size="lg"
        variant={isListening ? 'destructive' : 'default'}
        className={cn(
          'w-16 h-16 rounded-full shadow-lg transition-all',
          isListening && 'animate-pulse scale-110',
          isProcessing && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleMicClick}
        disabled={isProcessing || isSpeaking}
      >
        {isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        {isListening ? 'Tap to stop' : 'Tap to speak'}
      </p>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Voice toggle */}
        <Button
          variant={voiceEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleVoice}
          className="gap-2"
        >
          {voiceEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
          {voiceEnabled ? 'Voice On' : 'Voice Off'}
        </Button>

        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Languages className="w-4 h-4" />
              {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'Language'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {SUPPORTED_LANGUAGES.map(lang => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={cn(
                  'cursor-pointer',
                  selectedLanguage === lang.code && 'bg-primary/10'
                )}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Ask questions about your document. Answers are strictly grounded in the uploaded content.
      </p>
    </div>
  );
}
