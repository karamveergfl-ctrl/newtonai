import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Attachment } from "@/components/newton-assistant/NewtonAttachmentButton";

export interface NewtonMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export function useNewtonChat(conversationId: string | null) {
  const [messages, setMessages] = useState<NewtonMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const titleGeneratedRef = useRef<Set<string>>(new Set());

  // Load messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("newton_messages")
          .select("id, role, content, attachments, created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (cancelled) return;
        if (fetchError) throw fetchError;

        setMessages(
          (data || []).map((m: any) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(m.created_at),
            attachments: m.attachments || [],
          }))
        );
      } catch (e) {
        console.error("Failed to load messages:", e);
      }
    })();

    return () => { cancelled = true; };
  }, [conversationId]);

  // Migrate old localStorage history on mount (one-time)
  useEffect(() => {
    const STORAGE_KEY = "newton-chat-history";
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    (async () => {
      try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.length === 0) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Create a conversation for the old messages
        const { data: conv, error: convErr } = await supabase
          .from("newton_conversations")
          .insert({ user_id: user.id, title: "Previous Chat" })
          .select("id")
          .single();

        if (convErr || !conv) return;

        const rows = parsed.map((m: any) => ({
          conversation_id: conv.id,
          role: m.role,
          content: m.content,
          created_at: m.timestamp || new Date().toISOString(),
        }));

        await supabase.from("newton_messages").insert(rows);
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Silently fail migration
      }
    })();
  }, []);

  const saveMessageToDB = useCallback(async (
    convId: string,
    role: "user" | "assistant",
    content: string,
    attachments?: Attachment[]
  ) => {
    try {
      await supabase.from("newton_messages").insert({
        conversation_id: convId,
        role,
        content,
        attachments: attachments ? JSON.parse(JSON.stringify(attachments.map(a => ({ name: a.name, type: a.type })))) : [],
      });
      // Touch conversation updated_at
      await supabase
        .from("newton_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
    } catch (e) {
      console.error("Failed to save message:", e);
    }
  }, []);

  const generateTitle = useCallback(async (convId: string, firstUserMsg: string) => {
    if (titleGeneratedRef.current.has(convId)) return;
    titleGeneratedRef.current.add(convId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newton-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "Generate a short 3-5 word title for this conversation. Reply with ONLY the title, no quotes." },
              { role: "user", content: firstUserMsg.slice(0, 200) },
            ],
            stream: false,
          }),
        }
      );

      if (!response.ok) return;
      const data = await response.json();
      const title = data?.choices?.[0]?.message?.content?.trim();
      if (title && title.length < 60) {
        await supabase
          .from("newton_conversations")
          .update({ title })
          .eq("id", convId);
      }
    } catch {
      // Silent fail for title generation
    }
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    createConversation: () => Promise<string | null>,
    attachment?: Attachment | null
  ) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    let convId = conversationId;

    // Create conversation if needed
    if (!convId) {
      convId = await createConversation();
      if (!convId) {
        setError("Failed to create conversation");
        return;
      }
    }

    const userMessage: NewtonMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      attachments: attachment ? [attachment] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to DB
    await saveMessageToDB(convId, "user", content.trim(), attachment ? [attachment] : undefined);

    // Generate title after first user message
    const isFirstMsg = messages.length === 0;
    if (isFirstMsg) {
      generateTitle(convId, content.trim());
    }

    const assistantMessage: NewtonMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();

      // Build API messages with attachment context
      const apiMessages: { role: string; content: string }[] = messages.concat(userMessage).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      if (attachment) {
        apiMessages.splice(apiMessages.length - 1, 0, {
          role: "system",
          content: `The user has attached a document named "${attachment.name}". Here is the extracted text content:\n\n${attachment.extractedText}`,
        });
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const authToken = currentSession?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newton-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ messages: apiMessages, stream: true }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id ? { ...m, content: assistantContent } : m
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant message to DB
      if (assistantContent) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: assistantContent, timestamp: new Date() }
              : m
          )
        );
        await saveMessageToDB(convId, "assistant", assistantContent);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id));
      } else {
        console.error("Newton chat error:", err);
        setError(err instanceof Error ? err.message : "Failed to get response");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: "Sorry, I encountered an error. Please try again." }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, conversationId, saveMessageToDB, generateTitle]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    cancelRequest,
    clearHistory,
  };
}
