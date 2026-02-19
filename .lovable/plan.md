

## Progressive Signup Gate for NewtonAI Tools

### Overview
Transform the current `ToolAuthGate` from a hard auth wall into a progressive trial system. Unauthenticated visitors get 2 free tool uses tracked via localStorage, then see a conversion modal prompting signup.

### Architecture

**Key Principle**: Minimal changes to existing tool pages. The `ToolAuthGate` component is already wrapped around the interactive parts of every tool page. We modify it to allow guest access with usage tracking instead of immediately blocking.

### Changes

#### 1. New Hook: `src/hooks/useGuestUsage.ts`
- Manages guest trial state using localStorage
- Generates a `guest_session_id` (UUID) stored in localStorage
- Tracks `guest_usage_count` per tool (stored as JSON object)
- `MAX_GUEST_USES = 2` (total across all tools)
- Exposes: `{ canUseAsGuest, incrementGuestUsage, guestUsageCount, maxUses, guestSessionId }`
- On auth state change (user signs up), clears guest tracking from localStorage

#### 2. New Component: `src/components/GuestTrialLimitModal.tsx`
- Shown when guest hits the 2-use limit
- Title: "Save Your Progress -- Create Your Free Account"
- Message emphasizing value: save materials, unlimited tools, sync across devices
- Buttons: "Create Free Account", "Sign In", "Maybe Later" (closes modal but tools remain locked)
- Uses the same `framer-motion` animation style as `SignInRequiredModal`
- Passes `returnTo` for post-auth redirection

#### 3. Modify: `src/components/ToolAuthGate.tsx`
Current behavior: If no session, show sign-in CTA immediately.
New behavior:
- If authenticated: show children (unchanged)
- If not authenticated AND guest has remaining uses: show children (allow tool usage)
- If not authenticated AND guest has exhausted uses: show the limit modal/CTA
- Expose a `onToolUsed` callback that tool pages call after successful generation to increment guest count

#### 4. New Context: `src/contexts/GuestTrialContext.tsx`
- Wraps the app to provide guest usage state globally
- Provides `incrementGuestUsage()` that tool pages call after a successful generation
- Provides `guestLimitReached` boolean
- On `onAuthStateChange` detecting a new signup, clears guest localStorage data

#### 5. Modify Tool Pages (minimal touch)
Each tool page (HomeworkHelp, AIQuiz, AIFlashcards, AISummarizer, AILectureNotes, MindMap, AIPodcast) already calls `useFeatureLimitGate` for authenticated usage tracking. For guest users:
- After a successful generation, call `incrementGuestUsage()` from the context
- The `ToolAuthGate` wrapper automatically handles showing/hiding based on remaining uses
- No structural changes to tool page layouts

#### 6. Guest Content Persistence (Simplified)
- Generated content (quiz results, flashcards, summaries) is already rendered client-side in component state
- No server-side guest session table needed initially -- localStorage tracking is sufficient
- Content is ephemeral for guests (displayed in-session, lost on page refresh)
- On signup, the user starts fresh with their authenticated account and full limits
- A subtle banner warns guests: "Sign up to save your generated content"

### What We Are NOT Doing (Keeping It Simple)
- No server-side `guest_sessions` table (localStorage is sufficient for trial gating)
- No migration of guest-generated content to authenticated accounts (complex, low ROI)
- No changes to edge functions or backend
- No database migrations needed

### SEO and Ad Compliance
- Educational content, FAQs, and promo sections remain fully visible (they're outside `ToolAuthGate`)
- The interactive tool input area is what gets progressively gated
- Crawlers see all educational content unchanged
- Landing page remains fully accessible

### Technical Details

**`useGuestUsage.ts` core logic:**
```typescript
const STORAGE_KEY = "newton_guest_trial";
const MAX_USES = 2;

// Stored shape: { id: string, count: number, expiry: number }
// Expiry: 7 days from first use (auto-reset)
```

**`ToolAuthGate.tsx` updated logic:**
```typescript
if (session) return children;
if (!guestLimitReached) return children; // Allow guest usage
return <GuestTrialLimitModal />; // Show conversion modal
```

**Guest usage increment** -- called from each tool's generation success handler:
```typescript
const { incrementGuestUsage } = useGuestTrial();
// After successful generation:
if (!session) incrementGuestUsage();
```

### File Summary
| File | Action |
|------|--------|
| `src/hooks/useGuestUsage.ts` | Create |
| `src/contexts/GuestTrialContext.tsx` | Create |
| `src/components/GuestTrialLimitModal.tsx` | Create |
| `src/components/ToolAuthGate.tsx` | Modify |
| `src/App.tsx` | Wrap with GuestTrialProvider |
| `src/pages/tools/HomeworkHelp.tsx` | Add guest increment call |
| `src/pages/tools/AIQuiz.tsx` | Add guest increment call |
| `src/pages/tools/AIFlashcards.tsx` | Add guest increment call |
| `src/pages/tools/AISummarizer.tsx` | Add guest increment call |
| `src/pages/tools/AILectureNotes.tsx` | Add guest increment call |
| `src/pages/tools/MindMap.tsx` | Add guest increment call |
| `src/pages/tools/AIPodcast.tsx` | Add guest increment call |

