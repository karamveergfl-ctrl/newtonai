import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { toast } from 'sonner';

export interface ClassChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface UseClassChatOptions {
  classId: string;
}

export function useClassChat({ classId }: UseClassChatOptions) {
  const [messages, setMessages] = useState<ClassChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ClassChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMessage: ClassChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const conversationHistory = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetchWithTimeout(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newton-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are Newton, a class-specific AI tutor. Answer ONLY from the class materials provided. If the question is outside the scope of this class's content, politely say you can only help with topics covered in class. ClassId: ${classId}`,
              },
              ...conversationHistory,
              { role: 'user', content: content.trim() },
            ],
            stream: true,
            classId,
          }),
          signal: abortControllerRef.current.signal,
          timeoutMs: 60000,
        }
      );

      if (!response.ok) {
        if (response.status === 429) throw new Error('Rate limit exceeded');
        throw new Error(`Request failed: ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessage.id ? { ...m, content: assistantContent } : m
                )
              );
            }
          } catch { break; }
        }
      }

      if (assistantContent) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id ? { ...m, content: assistantContent } : m
          )
        );
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id));
      } else {
        toast.error(err?.message || 'Failed to get response');
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id
              ? { ...m, content: 'Sorry, I encountered an error. Please try again.', isError: true }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [classId, messages, isLoading]);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, cancelRequest, clearMessages };
}
