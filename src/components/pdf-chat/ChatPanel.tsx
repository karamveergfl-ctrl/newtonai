import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Mic, Copy, Check, Loader2, StopCircle, RotateCcw, Volume2, VolumeX, MicOff } from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { CitationChip } from './CitationChip';
import { ContextModeSelector } from './ContextModeSelector';
import { SuggestedQuestions } from './SuggestedQuestions';
import { ConfidenceIndicator, SpellCorrectionNotice, SuggestedTopics } from './ConfidenceIndicator';
import { SpeakingIndicator } from './SpeakingIndicator';
import { VoiceWaveform } from './VoiceWaveform';
import { LottieNewton } from '@/components/newton/LottieNewton';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useToast } from '@/hooks/use-toast';
import newtonCharacter from '@/assets/newton-character.png';
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
  onSuggestedTopicClick?: (topic: string) => void;
  disabled?: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  processingProgress?: number;
  streamingContent?: string;
  isStreaming?: boolean;
  documentId?: string | null;
  sessionId?: string | null;
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
  onSuggestedTopicClick,
  disabled = false,
  processingStatus,
  processingProgress = 0,
  streamingContent,
  isStreaming,
  documentId,
  sessionId,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Voice chat integration
  const {
    isListening,
    isSpeaking,
    isProcessing: isVoiceProcessing,
    transcript,
    interimTranscript,
    voiceEnabled,
    startListening,
    stopListening,
    stopSpeaking,
    toggleVoiceMode,
    replayLastAnswer,
  } = useVoiceChat({
    documentId: documentId || null,
    sessionId: sessionId || null,
    onCitationFound: (pageNumber, quote) => {
      onCitationClick(pageNumber, quote);
    },
    onTranscript: (text) => {
      // When voice transcript is ready, send it as a message
      if (text.trim()) {
        onSendMessage(text);
      }
    },
  });

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

  const handleTopicClick = (topic: string) => {
    if (onSuggestedTopicClick) {
      onSuggestedTopicClick(topic);
    } else {
      onSendMessage(`Tell me about "${topic}"`);
    }
  };

  const handleVoiceRecord = async () => {
    if (isListening) {
      await stopListening();
    } else {
      try {
        await startListening();
      } catch (error) {
        toast({
          title: 'Microphone Error',
          description: 'Please allow microphone access to use voice chat.',
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

  // Enable chat when document ID exists OR processing has started/completed
  const isReady = 
    !!documentId ||  // If we have a document ID, we're ready
    processingStatus === 'completed' || 
    processingStatus === 'processing' ||
    processingProgress > 0;
  const isProcessingDoc = processingStatus === 'processing';

  // Get the last user message for spell correction display
  const getLastUserQuery = (index: number): string | null => {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return messages[i].content;
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with context mode */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          {messages.length > 0 && onClearMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearMessages}
              className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3" />
              New Chat
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
            <img 
              src={newtonCharacter} 
              alt="Newton AI" 
              className="w-24 h-24 object-contain"
            />
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
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  {/* Spell correction notice for assistant messages */}
                  {msg.role === 'assistant' && msg.correctedQuery && (
                    <div className="mb-2">
                      <SpellCorrectionNotice
                        originalQuery={getLastUserQuery(index) || ''}
                        correctedQuery={msg.correctedQuery}
                      />
                    </div>
                  )}

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

                  {/* Suggested topics for clarification */}
                  {msg.role === 'assistant' && msg.confidence === 'clarify' && msg.suggestedTopics && (
                    <div className="mt-2">
                      <SuggestedTopics
                        topics={msg.suggestedTopics}
                        onTopicClick={handleTopicClick}
                      />
                    </div>
                  )}

                  {/* Citations, confidence, and actions for assistant messages */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* Confidence indicator */}
                      {msg.confidence && (
                        <ConfidenceIndicator 
                          level={msg.confidence} 
                          correctedQuery={msg.correctedQuery}
                        />
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

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="px-3 py-2 border-t">
          <SpeakingIndicator isSpeaking={isSpeaking} onStop={stopSpeaking} />
        </div>
      )}

      {/* Voice transcript preview */}
      {(isListening || interimTranscript) && (
        <div className="px-3 py-2 bg-primary/5 border-t">
          <div className="flex items-center gap-2">
            <VoiceWaveform isActive={isListening} type="listening" className="w-12" />
            <span className="text-sm text-muted-foreground">
              {interimTranscript || 'Listening...'}
            </span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        {/* Voice toggle button */}
        <Button
          onClick={toggleVoiceMode}
          size="icon"
          variant={voiceEnabled ? 'default' : 'ghost'}
          title={voiceEnabled ? 'Voice responses on' : 'Voice responses off'}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
        
        <Button
          onClick={handleVoiceRecord}
          disabled={isLoading || disabled || !isReady || isVoiceProcessing}
          size="icon"
          variant={isListening ? 'destructive' : 'outline'}
        >
          {isListening ? (
            <MicOff className="w-4 h-4 animate-pulse" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
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
          disabled={isLoading || isListening || disabled || !isReady}
          className="flex-1"
        />
        <Button 
          onClick={handleSend} 
          disabled={isLoading || !input.trim() || isListening || disabled || !isReady} 
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
