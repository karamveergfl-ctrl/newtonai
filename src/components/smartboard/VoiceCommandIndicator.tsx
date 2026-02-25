import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceCommandIndicatorProps {
  isListening: boolean;
  isProcessing: boolean;
  lastCommand: { label: string; result?: string } | null;
}

export function VoiceCommandIndicator({
  isListening,
  isProcessing,
  lastCommand,
}: VoiceCommandIndicatorProps) {
  return (
    <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2">
      {/* Mic status badge */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors",
          isListening
            ? "bg-primary/20 text-primary border border-primary/30"
            : "bg-muted/80 text-muted-foreground border border-border"
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isListening ? (
          <Mic className="w-3.5 h-3.5" />
        ) : (
          <MicOff className="w-3.5 h-3.5" />
        )}
        <span>{isProcessing ? "Processing…" : isListening ? "Listening" : "Voice Off"}</span>
      </div>

      {/* Last command */}
      {lastCommand && (
        <div className="max-w-[280px] rounded-lg bg-card/90 backdrop-blur-sm border border-border p-2.5 text-xs shadow-md animate-note-reveal">
          <p className="font-semibold text-primary">{lastCommand.label}</p>
          {lastCommand.result && (
            <p className="mt-1 text-muted-foreground line-clamp-3">{lastCommand.result}</p>
          )}
        </div>
      )}
    </div>
  );
}
