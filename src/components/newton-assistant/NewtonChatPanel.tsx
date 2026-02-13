import { memo, useRef, useEffect, useState, useCallback, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send, Trash2, Sparkles, StopCircle, X, Mic, MicOff, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { NewtonMessageBubble } from "./NewtonMessageBubble";
import { NewtonAttachmentButton, type Attachment } from "./NewtonAttachmentButton";
import { LottieNewton } from "@/components/newton/LottieNewton";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useToast } from "@/hooks/use-toast";
import type { NewtonMessage } from "@/hooks/useNewtonChat";
import newtonChatAvatar from "@/assets/newton-chat-avatar.png";

interface NewtonChatPanelProps {
  messages: NewtonMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (message: string, attachment?: Attachment | null) => void;
  onCancel: () => void;
  onClear: () => void;
  onClose?: () => void;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

const SUGGESTIONS = [
  "Explain this concept simply",
  "Help me solve a math problem",
  "Give me study tips",
  "Summarize a topic for me",
];

export const NewtonChatPanel = memo(function NewtonChatPanel({
  messages,
  isLoading,
  error,
  onSend,
  onCancel,
  onClear,
  onClose,
  onToggleSidebar,
  showSidebarToggle,
}: NewtonChatPanelProps) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);

  const processVoiceQuery = useCallback((query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      toast({ title: "Didn't catch that", description: "Please try speaking again." });
      setIsVoiceProcessing(false);
      return;
    }
    setIsVoiceProcessing(true);
    onSend(trimmed, attachment);
    setInput("");
    setAttachment(null);
    setIsVoiceProcessing(false);
  }, [onSend, toast, attachment]);

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    language: 'en-IN',
    continuous: true,
    interimResults: true,
    silenceTimeout: 2000,
    maxListeningTime: 10000,
    onAutoStop: (finalTranscript) => {
      processVoiceQuery(finalTranscript);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isListening) {
      const currentText = transcript + (interimTranscript ? ` ${interimTranscript}` : '');
      if (currentText.trim()) setInput(currentText.trim());
    }
  }, [transcript, interimTranscript, isListening]);

  const handleVoiceToggle = useCallback(async () => {
    if (isListening) {
      const finalTranscript = await stopListening();
      processVoiceQuery(finalTranscript);
    } else {
      try {
        await startListening();
      } catch (err: any) {
        toast({
          title: 'Voice Error',
          description: err?.name === 'NotAllowedError'
            ? 'Microphone access denied.'
            : 'Unable to start voice recording.',
          variant: 'destructive',
        });
      }
    }
  }, [isListening, startListening, stopListening, processVoiceQuery, toast]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim(), attachment);
      setInput("");
      setAttachment(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl border shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2.5">
          {showSidebarToggle && onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm">
            <img src={newtonChatAvatar} alt="Newton" className="w-full h-full object-cover scale-150" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Newton AI</h3>
            <p className="text-xs text-muted-foreground">Ask me anything</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <LottieNewton state="sleeping" size="sm" />
            <h4 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              What can I help you with?
            </h4>
            <p className="text-sm text-muted-foreground mb-8 max-w-[300px]">
              Your AI study buddy. Ask me anything about homework, concepts, or study tips.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleSuggestion(suggestion)}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <NewtonMessageBubble
                key={message.id}
                message={message}
                isStreaming={isLoading && index === messages.length - 1 && message.role === "assistant"}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs">{error}</div>
      )}

      {/* Attachment chip */}
      {attachment && (
        <div className="px-3 pt-2">
          <NewtonAttachmentButton
            onAttach={setAttachment}
            currentAttachment={attachment}
            onRemove={() => setAttachment(null)}
          />
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          {!attachment && (
            <NewtonAttachmentButton
              onAttach={setAttachment}
              disabled={isLoading}
              currentAttachment={null}
              onRemove={() => setAttachment(null)}
            />
          )}

          {/* Voice button */}
          <Button
            onClick={handleVoiceToggle}
            variant={isListening ? "default" : "outline"}
            size="icon"
            className={cn(
              "h-[42px] w-[42px] shrink-0 transition-all",
              isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
            )}
            disabled={isLoading}
            title={isListening ? "Stop recording" : "Start voice input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isVoiceProcessing
                ? "Processing..."
                : isListening
                  ? "Listening... (auto-sends when you pause)"
                  : "Ask Newton anything..."
            }
            className={cn(
              "min-h-[42px] max-h-[120px] resize-none text-sm",
              "bg-background border-muted-foreground/20",
              "focus-visible:ring-primary/50",
              isListening && "border-red-500/50"
            )}
            rows={1}
            disabled={isLoading || isVoiceProcessing}
          />
          {isLoading ? (
            <Button onClick={onCancel} variant="outline" size="icon" className="h-[42px] w-[42px] shrink-0">
              <StopCircle className="w-5 h-5 text-destructive" />
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!input.trim()} size="icon" className="h-[42px] w-[42px] shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center hidden sm:block">
          {isListening ? "Tap mic again to stop and send" : "Press Enter to send • Shift+Enter for new line"}
        </p>
      </div>
    </div>
  );
});
