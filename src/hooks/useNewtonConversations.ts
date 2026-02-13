import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NewtonConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useNewtonConversations() {
  const [conversations, setConversations] = useState<NewtonConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("newton_conversations")
        .select("id, title, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(async (title = "New Chat"): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("newton_conversations")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();

      if (error) throw error;
      
      await fetchConversations();
      setActiveConversationId(data.id);
      return data.id;
    } catch (err) {
      console.error("Failed to create conversation:", err);
      return null;
    }
  }, [fetchConversations]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("newton_conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }, [activeConversationId]);

  const updateTitle = useCallback(async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from("newton_conversations")
        .update({ title })
        .eq("id", id);

      if (error) throw error;
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    } catch (err) {
      console.error("Failed to update conversation title:", err);
    }
  }, []);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  // Group conversations by date
  const groupedConversations = groupByDate(conversations);

  return {
    conversations,
    groupedConversations,
    activeConversationId,
    setActiveConversationId,
    isLoading,
    createConversation,
    deleteConversation,
    updateTitle,
    startNewChat,
    fetchConversations,
  };
}

function groupByDate(conversations: NewtonConversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; items: NewtonConversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 Days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conv of conversations) {
    const date = new Date(conv.updated_at);
    if (date >= today) {
      groups[0].items.push(conv);
    } else if (date >= yesterday) {
      groups[1].items.push(conv);
    } else if (date >= weekAgo) {
      groups[2].items.push(conv);
    } else {
      groups[3].items.push(conv);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}
