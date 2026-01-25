import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Mic, Copy, Check, Loader2, Sparkles, StopCircle, RotateCcw } from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { CitationChip } from './CitationChip';
import { ContextModeSelector } from './ContextModeSelector';
import { SuggestedQuestions } from './SuggestedQuestions';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { LottieNewton } from '@/components/newton/LottieNewton';
import { AudioRecorder, blobToBase64 } from '@/utils/audioRecorder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, ContextMode } from '@/hooks/usePDFChat';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  contextMode: ContextMode;
  selectedText: string | null;
  onSendMessage: (message: string) => void;
  onCancelRequest: () => void;
  onContextModeChange: (mode: ContextMode) => void;
  onCitationClick: (pageNumber: number, quote: string) => void;
  onClearMessages?: () => void;
  disabled?: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  processingProgress?: number;
  streamingContent?: string;
  isStreaming?: boolean;
}

export function ChatPanel({
  messages,
  isLoading,
  contextMode,
  selectedText,
  onSendMessage,
  onCancelRequest,
  onContextModeChange,
  onCitationClick,
  onClearMessages,
  disabled = false,
  processingStatus,
  processingProgress = 0,
  streamingContent,
  isStreaming,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, streamingContent]);

  const handleSend = () => {
    if (!input.trim() || isLoading || disabled) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionSelect = (question: string) => {
    onSendMessage(question);
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      try {
        const audioBlob = await audioRecorder.current.stop();
        setIsRecording(false);
        
        const base64Audio = await blobToBase64(audioBlob);
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio },
        });

        if (error) throw error;
        if (data.text) {
          onSendMessage(data.text);
        }
      } catch (error) {
        console.error('Transcription error:', error);
        toast({
          title: 'Error',
          description: 'Failed to transcribe audio',
          variant: 'destructive',
        });
      }
    } else {
      try {
        await audioRecorder.current.start();
        setIsRecording(true);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to access microphone',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCopy = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isReady = processingStatus === 'completed';
  const isProcessingDoc = processingStatus === 'processing';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with context mode */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Chat with PDF</span>
          {messages.length > 0 && onClearMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearMessages}
              className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3" />
              New
            </Button>
          )}
        </div>
        <ContextModeSelector
          mode={contextMode}
          onChange={onContextModeChange}
          hasSelection={!!selectedText}
          disabled={disabled || !isReady}
        />
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
            <LottieNewton state="thinking" size="lg" />
            <h3 className="font-semibold text-lg mt-4">Ask anything about this document</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">
              Answers are generated only from its content. No external knowledge will be used.
            </p>
            
            {isProcessingDoc && (
              <div className="mt-4 w-full max-w-xs">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Analyzing document... {processingProgress}%
                </p>
              </div>
            )}

            {/* Suggested questions */}
            {isReady && (
              <SuggestedQuestions 
                onSelect={handleSuggestionSelect}
                disabled={isLoading}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {/* Citations, confidence, and actions for assistant messages */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* Confidence indicator */}
                      {msg.confidence && (
                        <ConfidenceIndicator level={msg.confidence} />
                      )}
                      
                      {msg.citations && msg.citations.length > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground">Sources:</span>
                          {msg.citations.map((citation, idx) => (
                            <CitationChip
                              key={`${citation.chunkId}-${idx}`}
                              citation={citation}
                              onClick={onCitationClick}
                            />
                          ))}
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs gap-1"
                        onClick={() => handleCopy(msg.content, msg.id)}
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Copy
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="p-3 rounded-lg bg-muted">
                    <MarkdownRenderer content={streamingContent} />
                    <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse ml-0.5" />
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !isStreaming && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                  <LottieNewton state="thinking" size="sm" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={onCancelRequest}
                  >
                    <StopCircle className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Selected text indicator */}
      {selectedText && contextMode === 'selected_text' && (
        <div className="px-3 py-2 bg-primary/5 border-t text-xs">
          <span className="text-muted-foreground">Asking about: </span>
          <span className="italic">"{selectedText.slice(0, 50)}..."</span>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <Button
          onClick={handleVoiceRecord}
          disabled={isLoading || disabled || !isReady}
          size="icon"
          variant={isRecording ? 'destructive' : 'outline'}
        >
          <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            !isReady 
              ? 'Processing document...' 
              : 'Ask a question about this document...'
          }
          disabled={isLoading || isRecording || disabled || !isReady}
          className="flex-1"
        />
        <Button 
          onClick={handleSend} 
          disabled={isLoading || !input.trim() || isRecording || disabled || !isReady} 
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
