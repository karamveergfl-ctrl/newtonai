import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Citation {
  pageNumber: number;
  chunkId: string;
  quote: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  createdAt: Date;
}

export type ContextMode = 'entire_document' | 'current_page' | 'selected_text';

interface UsePDFChatOptions {
  documentId: string | null;
  sessionId: string | null;
}

export function usePDFChat({ documentId, sessionId }: UsePDFChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextMode, setContextMode] = useState<ContextMode>('entire_document');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const sendMessage = useCallback(async (question: string) => {
    if (!documentId || !question.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      abortControllerRef.current = new AbortController();

      const { data, error } = await supabase.functions.invoke('rag-chat-pdf', {
        body: {
          documentId,
          sessionId,
          question,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
          contextMode,
          currentPage: contextMode === 'current_page' ? currentPage : null,
          selectedText: contextMode === 'selected_text' ? selectedText : null,
        },
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations || [],
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Clear selected text after using it
      if (contextMode === 'selected_text') {
        setSelectedText(null);
        setContextMode('entire_document');
      }

      return data;
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [documentId, sessionId, messages, contextMode, currentPage, selectedText, isLoading, toast]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const updateContextMode = useCallback((mode: ContextMode) => {
    setContextMode(mode);
  }, []);

  const updateSelectedText = useCallback((text: string | null) => {
    setSelectedText(text);
    if (text) {
      setContextMode('selected_text');
    }
  }, []);

  return {
    messages,
    isLoading,
    contextMode,
    currentPage,
    selectedText,
    sendMessage,
    cancelRequest,
    clearMessages,
    setContextMode: updateContextMode,
    setCurrentPage,
    setSelectedText: updateSelectedText,
  };
}
