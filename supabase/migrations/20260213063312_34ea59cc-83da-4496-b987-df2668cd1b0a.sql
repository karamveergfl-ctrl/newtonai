
-- Conversations table
CREATE TABLE public.newton_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages table  
CREATE TABLE public.newton_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.newton_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newton_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newton_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Users can SELECT their own conversations
CREATE POLICY "Users can view own conversations"
  ON public.newton_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: Users can INSERT their own conversations
CREATE POLICY "Users can create own conversations"
  ON public.newton_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS: Users can UPDATE their own conversations
CREATE POLICY "Users can update own conversations"
  ON public.newton_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS: Users can DELETE their own conversations
CREATE POLICY "Users can delete own conversations"
  ON public.newton_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS: Users can SELECT messages in their conversations
CREATE POLICY "Users can view own messages"
  ON public.newton_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.newton_conversations
    WHERE id = newton_messages.conversation_id AND user_id = auth.uid()
  ));

-- RLS: Users can INSERT messages in their conversations
CREATE POLICY "Users can create own messages"
  ON public.newton_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.newton_conversations
    WHERE id = newton_messages.conversation_id AND user_id = auth.uid()
  ));

-- RLS: Users can DELETE messages in their conversations
CREATE POLICY "Users can delete own messages"
  ON public.newton_messages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.newton_conversations
    WHERE id = newton_messages.conversation_id AND user_id = auth.uid()
  ));

-- No updates to messages
CREATE POLICY "No message updates"
  ON public.newton_messages FOR UPDATE
  USING (false);

-- Indexes
CREATE INDEX idx_newton_conversations_user ON public.newton_conversations(user_id, updated_at DESC);
CREATE INDEX idx_newton_messages_conversation ON public.newton_messages(conversation_id, created_at);

-- Trigger for updated_at
CREATE TRIGGER update_newton_conversations_updated_at
  BEFORE UPDATE ON public.newton_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
