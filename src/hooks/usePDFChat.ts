import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Citation {
  pageNumber: number;
  chunkId: string;
  quote: string;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'clarify' | 'not_found';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  confidence?: ConfidenceLevel;
  correctedQuery?: string;
  suggestedTopics?: string[];
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
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Load conversation history when session changes
  useEffect(() => {
    if (sessionId) {
      loadConversationHistory();
    }
  }, [sessionId]);

  const loadConversationHistory = useCallback(async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('pdf_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: ChatMessage[] = data.map((msg) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          citations: (msg.citations as unknown as Citation[]) || [],
          createdAt: new Date(msg.created_at || Date.now()),
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  }, [sessionId]);

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
    setStreamingContent('');

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

      // Use the confidence returned from the backend
      const confidence: ConfidenceLevel = data.confidence || 'high';

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations || [],
        confidence,
        correctedQuery: data.correctedQuery,
        suggestedTopics: data.suggestedTopics,
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
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [documentId, sessionId, messages, contextMode, currentPage, selectedText, isLoading, toast]);

  // Handle clicking on a suggested topic
  const sendSuggestedTopic = useCallback((topic: string) => {
    sendMessage(`Tell me about "${topic}"`);
  }, [sendMessage]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
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
    streamingContent,
    isStreaming,
    sendMessage,
    sendSuggestedTopic,
    cancelRequest,
    clearMessages,
    setContextMode: updateContextMode,
    setCurrentPage,
    setSelectedText: updateSelectedText,
    loadConversationHistory,
  };
}
