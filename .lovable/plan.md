
# Fix Authentication: Sign Up and Sign In Broken

## Root Cause

There are **two competing bugs** in the authentication flow:

### Bug 1: Race Condition - Dual Navigation After Login
In `Auth.tsx`, when a user signs in:
- `handleAuth` calls `navigate("/dashboard")` directly (line 223)
- `onAuthStateChange` listener also fires and runs `checkOnboardingAndRedirect`, which navigates to either `/dashboard` or `/onboarding`

These two navigations conflict. The user briefly lands on `/dashboard`, where `ProtectedRoute` starts checking auth, but then gets redirected elsewhere.

### Bug 2: Profile Query Timing on Signup
With auto-confirm enabled (confirmed via `immediate_login_after_signup: true` in auth logs), when a user signs up:
1. Signup succeeds and user is immediately logged in
2. `onAuthStateChange` fires with `SIGNED_IN` event
3. `checkOnboardingAndRedirect` queries the `profiles` table
4. But the `handle_new_user` database trigger may not have committed the new profile row yet
5. Query returns no profile, so the code treats it as a "stale session" and calls `signOut()` -- logging the user out immediately

### Bug 3: Google OAuth uses wrong method
The code calls `supabase.auth.signInWithOAuth()` directly instead of using the Lovable Cloud managed `lovable.auth.signInWithOAuth()`. This may cause Google sign-in to fail entirely.

## Solution

### Fix 1: Remove duplicate navigation from `handleAuth`
The `handleAuth` login branch should NOT call `navigate("/dashboard")` directly. Instead, let the `onAuthStateChange` listener handle all post-login routing via `checkOnboardingAndRedirect`. This eliminates the race condition.

### Fix 2: Add retry logic for new signups
In `checkOnboardingAndRedirect`, if no profile is found, wait briefly and retry once before treating it as a stale session. This gives the database trigger time to create the profile row.

### Fix 3: Fix Google OAuth
Replace `supabase.auth.signInWithOAuth()` with `lovable.auth.signInWithOAuth("google", ...)`.

## Files to modify:
- `src/pages/Auth.tsx` -- all three fixes in this single file

## Technical Details

### Auth.tsx changes:

1. **Import lovable module** for Google OAuth:
```typescript
import { lovable } from "@/integrations/lovable/index";
```

2. **Update `checkOnboardingAndRedirect`** with retry logic:
```typescript
const checkOnboardingAndRedirect = async (session: any) => {
  if (!session) return;
  
  let profile = null;
  let error = null;
  
  // Try up to 2 times (handles race with handle_new_user trigger)
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .maybeSingle();
    
    profile = result.data;
    error = result.error;
    
    if (profile) break;
    if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
  }
  
  if (error || !profile) {
    console.warn("Stale session detected - signing out", error);
    await supabase.auth.signOut();
    return;
  }
  
  if (profile.onboarding_completed) {
    navigate("/dashboard");
  } else {
    navigate("/onboarding");
  }
};
```

3. **Remove `navigate("/dashboard")` from login handler** -- let `onAuthStateChange` handle it:
```typescript
// Login mode -- just sign in, let onAuthStateChange handle redirect
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) throw error;
toast({ title: "Welcome back!" });
// DON'T navigate here -- onAuthStateChange will route correctly
```

4. **Remove `setMode("login")` from signup handler** -- since auto-confirm logs the user in immediately, the `onAuthStateChange` listener will route them to onboarding automatically.

5. **Fix Google OAuth**:
```typescript
const handleGoogleSignIn = async () => {
  setLoading(true);
  try {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) throw error;
  } catch (error: any) {
    toast({ title: "Error", description: error.message, variant: "destructive" });
    setLoading(false);
  }
};
```
