import { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  X, 
  ArrowLeft, 
  Send,
  Loader2,
  FileText,
  Brain,
  BookOpen,
  Network,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { UniversalStudySettingsDialog, UniversalGenerationSettings } from '@/components/UniversalStudySettingsDialog';
import { useProcessingOverlay } from '@/contexts/ProcessingOverlayContext';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not_found';

interface Citation {
  sectionIndex: number;
  quote: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  confidence?: ConfidenceLevel;
  citations?: Citation[];
}

interface TextChatViewProps {
  textContent: string;
  documentName: string;
  onClose?: () => void;
  onNewDocument?: () => void;
}

type StudyToolType = 'quiz' | 'flashcards' | 'summary' | 'mindmap';

export function TextChatView({ 
  textContent, 
  documentName, 
  onClose,
  onNewDocument 
}: TextChatViewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showProcessing, hideProcessing } = useProcessingOverlay();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeToolDialog, setActiveToolDialog] = useState<StudyToolType | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoize conversation history for API calls
  const conversationHistory = useMemo(() => 
    messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content,
    })), [messages]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/dashboard');
    }
  };

  const handleNewDocument = () => {
    if (onNewDocument) {
      onNewDocument();
    }
  };

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    try {
      // Use the new unified chat-with-content function
      const { data, error } = await supabase.functions.invoke('chat-with-content', {
        body: {
          question: text,
          textContent: textContent.slice(0, 30000), // Limit to 30k chars
          contentName: documentName,
          conversationHistory,
        },
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        confidence: data.confidence || 'high',
        citations: data.citations || [],
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, textContent, documentName, conversationHistory, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleToolGenerate = useCallback((tool: StudyToolType) => {
    setActiveToolDialog(tool);
  }, []);

  const handleSettingsConfirm = useCallback(async (settings: UniversalGenerationSettings) => {
    if (!activeToolDialog) return;
    
    const tool = activeToolDialog;
    setActiveToolDialog(null);
    
    showProcessing({
      message: `Generating ${tool.replace('_', ' ')}...`,
      subMessage: documentName,
      variant: 'overlay',
    });

    try {
      let endpoint = '';
      let body: Record<string, any> = {
        content: textContent.slice(0, 8000),
        sourceType: 'text',
        title: documentName,
      };

      switch (tool) {
        case 'quiz':
          endpoint = 'generate-quiz';
          body.count = settings.count || 10;
          body.difficulty = settings.difficulty || 'medium';
          break;
        case 'flashcards':
          endpoint = 'generate-flashcards';
          body.count = settings.count || 10;
          break;
        case 'summary':
          endpoint = 'generate-summary';
          body.detailLevel = settings.detailLevel || 'standard';
          body.format = settings.summaryFormat || 'concise';
          break;
        case 'mindmap':
          endpoint = 'generate-mindmap';
          body.style = settings.mindMapStyle || 'radial';
          break;
      }

      const { data, error } = await supabase.functions.invoke(endpoint, { body });
      
      if (error) throw error;

      hideProcessing();
      
      // Navigate to the appropriate tool page
      const routes: Record<StudyToolType, string> = {
        quiz: '/tools/quiz',
        flashcards: '/tools/flashcards',
        summary: '/tools/summarizer',
        mindmap: '/tools/mindmap',
      };

      sessionStorage.setItem(`text_${tool}_result`, JSON.stringify({
        data,
        source: documentName,
        sourceType: 'text',
      }));

      navigate(routes[tool], { state: { fromTextChat: true, result: data } });
    } catch (error) {
      hideProcessing();
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate content',
        variant: 'destructive',
      });
    }
  }, [activeToolDialog, textContent, documentName, showProcessing, hideProcessing, navigate, toast]);

  const suggestedQuestions = [
    "What are the main topics covered?",
    "Summarize the key points",
    "What are the important concepts?",
    "Explain the main argument",
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-background gap-2">
        <Button variant="ghost" size="sm" onClick={handleNewDocument} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs">New</span>
        </Button>
        
        <h1 className="font-semibold text-sm truncate flex-1 px-2 text-center">
          {documentName}
        </h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Settings2 className="w-4 h-4" />
              <span className="text-xs">Study</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleToolGenerate('quiz')}>
              <Brain className="w-4 h-4 mr-2 text-primary" />
              Generate Quiz
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToolGenerate('flashcards')}>
              <BookOpen className="w-4 h-4 mr-2 text-violet-500" />
              Generate Flashcards
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToolGenerate('summary')}>
              <FileText className="w-4 h-4 mr-2 text-amber-500" />
              Generate Summary
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToolGenerate('mindmap')}>
              <Network className="w-4 h-4 mr-2 text-rose-500" />
              Generate Mind Map
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4">
            <div className="p-3 rounded-xl bg-primary/10 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Ask about "{documentName}"</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">
              Ask questions about the content and get AI-powered answers grounded in your document.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {suggestedQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col gap-1.5 max-w-[85%]">
                  <Card
                    className={`p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </Card>
                  {/* Show confidence indicator for assistant messages */}
                  {msg.role === 'assistant' && msg.confidence && (
                    <div className="flex items-center gap-2 px-1">
                      <ConfidenceIndicator level={msg.confidence} />
                      {msg.citations && msg.citations.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted p-3">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </Card>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t bg-background">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this document..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={() => sendMessage()} 
            disabled={isLoading || !input.trim()} 
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Settings Dialog */}
      <UniversalStudySettingsDialog
        open={!!activeToolDialog}
        onOpenChange={(open) => !open && setActiveToolDialog(null)}
        type={activeToolDialog || 'quiz'}
        contentTitle={documentName}
        contentType="text"
        onGenerate={handleSettingsConfirm}
      />
    </div>
  );
}
