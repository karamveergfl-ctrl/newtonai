

# Newton AI Chat: Auth-Required + Always Full Screen

## Overview

Two changes to the Newton AI chat assistant:
1. Only show it to signed-in users (unauthenticated users see a sign-in prompt when clicking the button)
2. Always open in full-screen mode instead of the small floating panel

## Changes

### File: `src/components/GlobalNewtonAssistant.tsx`

**Auth gate:**
- Add a Supabase auth session check (listen via `onAuthStateChange`)
- When an unauthenticated user clicks the trigger button, show the `SignInRequiredModal` instead of opening the chat
- Once authenticated, the chat opens normally

**Always full screen:**
- Remove the `isFullScreen` toggle state -- always treat it as full screen
- Desktop: Use `fixed inset-4 z-50` layout (fills the screen with small margin) instead of the small `w-[380px] h-[520px]` panel
- Mobile: Keep the existing drawer at `h-[85vh]` (already near full screen)
- Remove the full-screen toggle button from the chat panel header (no longer needed)
- Show a close button in the top corner when the chat is open

### No other files need changes

The `NewtonChatPanel` already accepts `isFullScreen` and `onToggleFullScreen` as optional props, so we simply always pass `isFullScreen={true}` and omit the toggle callback.

## Technical Details

```text
User clicks Newton button
        |
   Authenticated?
   /           \
  YES           NO
  |              |
  Open chat     Show SignInRequiredModal
  (full screen)  -> redirects to /auth
```

### Specific code changes in `GlobalNewtonAssistant.tsx`:

1. **Add imports**: `supabase` client, `SignInRequiredModal`, `useState`/`useEffect` for auth
2. **Add auth state tracking**:
   - `const [isAuthenticated, setIsAuthenticated] = useState(false)`
   - `useEffect` with `supabase.auth.onAuthStateChange` + initial `getSession` check
3. **Add sign-in modal state**: `const [showSignIn, setShowSignIn] = useState(false)`
4. **Modify `handleToggle`**: If not authenticated, show sign-in modal instead of opening chat
5. **Remove `isFullScreen` state** -- replace with constant `true`
6. **Desktop layout**: Always use `fixed inset-4 z-50` when open, `fixed bottom-4 right-4 z-50` when closed (trigger button only)
7. **Pass `isFullScreen={true}`** to `NewtonChatPanel` without toggle callback
8. **Render `SignInRequiredModal`** at the bottom of the component
