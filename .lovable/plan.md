
# Newton AI Chat: Gemini-Style Redesign

## Overview

Transform the Newton AI chat into a Gemini-like experience with a sidebar for chat history, document upload support, voice input, and a close button inside the panel header. This is a significant UI overhaul involving new database tables, new components, and modifications to existing ones.

## What Changes

### 1. Close Button Moved Inside Header
Move the floating close button from `GlobalNewtonAssistant.tsx` into the `NewtonChatPanel` header bar, replacing the external overlay button for cleaner UX.

### 2. Chat History Sidebar (Gemini-style)
A collapsible left sidebar showing past conversations, grouped by recency ("Today", "Yesterday", "Previous 7 days"). Users can:
- Start a new chat (+ button)
- Click a past conversation to load it
- Delete old conversations

### 3. Persistent Chat Storage in Database
Replace localStorage with database-backed conversation storage:
- **New table: `newton_conversations`** -- stores conversation metadata (title, user_id, timestamps)
- **New table: `newton_messages`** -- stores individual messages per conversation
- Auto-generate conversation titles from the first user message

### 4. Document Upload in Chat
Add a "+" attachment button in the input area that lets users upload documents (PDF, images, DOCX). The uploaded file is:
- Extracted to text via the existing `extract-text` edge function
- Injected as context into the AI conversation
- Shown as an attachment chip in the chat

### 5. Voice Input (Already Exists)
Voice input via microphone is already implemented. No changes needed -- just ensure it remains visible and functional in the new layout.

### 6. Gemini-Style Empty State
When no messages exist, show a centered "What can I help you with?" heading with the input bar below, matching the Gemini aesthetic from the reference image.

---

## Technical Details

### Database Migration

```sql
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
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies (auth required, own data only)
ALTER TABLE public.newton_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newton_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations" ON public.newton_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own messages" ON public.newton_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM public.newton_conversations WHERE user_id = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX idx_newton_conversations_user ON public.newton_conversations(user_id, updated_at DESC);
CREATE INDEX idx_newton_messages_conversation ON public.newton_messages(conversation_id, created_at);
```

### New Files

1. **`src/hooks/useNewtonConversations.ts`** -- Hook to manage conversations list (CRUD via Supabase), load/save messages, auto-title generation
2. **`src/components/newton-assistant/NewtonSidebar.tsx`** -- Sidebar component showing conversation history grouped by date, "New Chat" button, delete option
3. **`src/components/newton-assistant/NewtonAttachmentButton.tsx`** -- "+" button that opens file picker, processes uploads via `extract-text`, shows attachment chips

### Modified Files

4. **`src/hooks/useNewtonChat.ts`** -- Refactor to work with database instead of localStorage; accept `conversationId`, save messages to DB after streaming completes, support attachments in context
5. **`src/components/newton-assistant/NewtonChatPanel.tsx`**:
   - Add `onClose` prop and render close button (X) inside the header
   - Add attachment button ("+") to the left of the input area
   - Update empty state to Gemini-style "What can I help you with?" centered text
   - Accept sidebar toggle callback
6. **`src/components/GlobalNewtonAssistant.tsx`**:
   - Remove the external floating close button
   - Pass `onClose` to `NewtonChatPanel`
   - Integrate the sidebar layout: sidebar on the left, chat panel on the right
   - Manage active conversation state

### Layout Structure (Desktop)

```text
+--------------------------------------------------+
| [Sidebar]         |  [Chat Panel]                 |
| New Chat btn      |  Header: Newton AI | X close  |
| Today             |                               |
|   - Chat title 1  |  "What can I help you with?"  |
|   - Chat title 2  |                               |
| Yesterday         |  [+ attach] [input] [mic] [>] |
|   - Chat title 3  |                               |
+--------------------------------------------------+
```

### Auto-Title Generation
After the first assistant response in a new conversation, generate a short title by sending a quick non-streaming request to `newton-chat` with the prompt: "Summarize this conversation in 3-5 words as a title". Update the conversation record.

### Document Upload Flow
1. User clicks "+" button
2. File picker opens (PDF, images, DOCX -- up to 20MB)
3. File uploaded to Supabase storage or processed via `extract-text` edge function
4. Extracted text appended to the next message as context
5. Attachment chip shown in the message bubble

### Migration from localStorage
On first load, check if localStorage has old Newton chat history. If found, create a conversation in the DB and migrate messages, then clear localStorage.
