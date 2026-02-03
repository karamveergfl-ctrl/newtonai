import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceWaveform } from './VoiceWaveform';
import { cn } from '@/lib/utils';

interface SpeakingIndicatorProps {
  isSpeaking: boolean;
  onStop: () => void;
  className?: string;
}

export function SpeakingIndicator({ isSpeaking, onStop, className }: SpeakingIndicatorProps) {
  if (!isSpeaking) return null;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg',
      className
    )}>
      <Volume2 className="w-4 h-4 text-green-500 animate-pulse" />
      <VoiceWaveform isActive={isSpeaking} type="speaking" className="w-16" />
      <span className="text-xs text-green-600 dark:text-green-400">Speaking...</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onStop}
        className="h-6 px-2 text-xs gap-1 hover:bg-green-500/20"
      >
        <VolumeX className="w-3 h-3" />
        Stop
      </Button>
    </div>
  );
}
