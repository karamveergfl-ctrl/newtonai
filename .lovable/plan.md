
# Fix: Password Reset "Auth session missing!" Error

## Problem Analysis

When users click the password reset link from their email, they see the "Auth session missing!" error when trying to update their password. This happens because:

1. **Supabase's password reset flow** sends tokens in the URL (access_token, refresh_token in hash)
2. **The app detects `mode=reset`** and shows the password update form immediately
3. **BUT the session hasn't been established yet** - Supabase needs to process the tokens first
4. **When user submits**, `supabase.auth.updateUser()` fails because there's no active session

The auth logs confirm this - showing "One-time token not found" errors when the token gets consumed or expires.

## Root Cause

In `Auth.tsx` lines 63-76, the code only sets the mode to `reset-password` when it detects URL tokens, but it doesn't:
1. Wait for Supabase to process the tokens and establish a session
2. Verify a session exists before allowing password update
3. Handle the case where the token is expired or already used

## Solution

Modify the Auth component to:
1. **Detect recovery flow and wait for session** - When URL has recovery tokens, show a loading state while Supabase establishes the session
2. **Verify session before showing form** - Only show the password update form after confirming an active session
3. **Handle token expiration gracefully** - If session can't be established (expired/used token), show an error and offer to resend the reset email

---

## Implementation Details

### File: `src/pages/Auth.tsx`

#### 1. Add new state for session verification
```typescript
const [isVerifyingSession, setIsVerifyingSession] = useState(false);
const [sessionVerified, setSessionVerified] = useState(false);
const [recoveryError, setRecoveryError] = useState<string | null>(null);
```

#### 2. Update the URL detection useEffect to wait for session
Instead of just setting the mode, the code will:
- Detect recovery flow from URL parameters
- Set a loading/verifying state
- Wait for `onAuthStateChange` to fire with the `PASSWORD_RECOVERY` event
- Only then set `sessionVerified = true` and show the form

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlMode = params.get('mode');
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const type = hashParams.get('type');
  
  // Check if this is a password reset flow
  if (urlMode === 'reset' || type === 'recovery' || accessToken) {
    setMode('reset-password');
    setIsVerifyingSession(true);
    
    // Supabase will automatically handle the token from URL
    // We listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionVerified(true);
        setIsVerifyingSession(false);
      }
    });
    
    // Also check if session already exists (token already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionVerified(true);
        setIsVerifyingSession(false);
      }
    });
    
    // Timeout for expired/invalid tokens
    const timeout = setTimeout(() => {
      if (!sessionVerified) {
        setIsVerifyingSession(false);
        setRecoveryError('Your password reset link has expired or is invalid. Please request a new one.');
      }
    }, 5000);
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }
}, []);
```

#### 3. Update handleAuth to verify session before update
```typescript
if (mode === "reset-password") {
  // Verify we have a session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Session expired. Please request a new password reset link.");
  }
  
  // ... rest of password validation and update logic
}
```

#### 4. Update UI to show loading/error states
- Show spinner while verifying session
- Show error message with "Request new link" button if token expired
- Only show password form when session is verified

---

## UI Changes

### When verifying session (loading state):
```
"Verifying your reset link..."
[Spinner]
```

### When token is expired/invalid:
```
"Reset link expired"
"Your password reset link has expired or is invalid."
[Request New Link Button] → switches to forgot-password mode
```

### When session is verified:
```
"Create a new password"
[Password form as normal]
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Add session verification logic, loading states, and error handling |

---

## Expected Behavior After Fix

1. **User clicks reset link** → Shows "Verifying your reset link..." with spinner
2. **Token is valid** → Session established, password form appears
3. **Token is expired** → Shows error with "Request New Link" button
4. **User enters new password** → Password updated successfully
5. **Session already expired** → Shows helpful error, doesn't show confusing "Auth session missing!" toast

---

## Technical Notes

- Supabase fires `PASSWORD_RECOVERY` event when processing a valid recovery token
- The `access_token` in the URL hash is automatically consumed by Supabase's `onAuthStateChange` listener
- A 5-second timeout is used to detect expired/invalid tokens (Supabase processes quickly if valid)
- Clearing URL params after verification prevents re-triggering on page refresh
