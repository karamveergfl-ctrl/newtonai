

# Fix: Authentication Redirect Loop

## Root Cause

The auth logs show users being logged in and then **logged out within seconds** (email login at 11:27:10, logout at 11:27:11; Google login at 11:27:23, logout at 11:27:35). This points to a **deadlock** in the `onAuthStateChange` callback.

### The Deadlock

In `Auth.tsx` (line 158-160), the `onAuthStateChange` callback calls `checkOnboardingAndRedirect`, which makes a Supabase database query (`supabase.from("profiles").select(...)`). Making Supabase client calls **inside** an `onAuthStateChange` callback can deadlock because the client internally needs to resolve auth state while the auth state change is still being processed.

When the deadlock occurs, the profile query hangs or fails, the retry loop exhausts, and the code hits the "stale session" path which calls `signOut()` -- immediately logging the user out.

The same issue exists in `OnboardingGate.tsx` -- if the user manages to reach `/dashboard`, the OnboardingGate also queries profiles and may trigger the same deadlock-induced signout.

### Google OAuth Landing Issue

After Google OAuth completes, the user is redirected to `window.location.origin` (the root `/` landing page). There's no routing logic on the landing page to check onboarding status and redirect to `/dashboard`. The user lands on the homepage with a valid session but no onward navigation.

## Solution

### 1. Fix the deadlock in Auth.tsx
Wrap the `checkOnboardingAndRedirect` call in `setTimeout(fn, 0)` when called from `onAuthStateChange`. This allows the auth state change to complete before making additional Supabase calls.

### 2. Fix the deadlock in OnboardingGate.tsx  
Use `setTimeout(fn, 0)` pattern for the profile query to prevent deadlock when triggered by auth state changes.

### 3. Fix Google OAuth redirect
Change the `redirect_uri` to `window.location.origin + '/auth'` so users return to the auth page where the routing logic lives.

### 4. Skip routing for password recovery events
Guard the `onAuthStateChange` handler to skip the `PASSWORD_RECOVERY` event, which should not trigger redirect logic.

## Files to Modify

- `src/pages/Auth.tsx` -- fixes 1, 3, and 4
- `src/components/OnboardingGate.tsx` -- fix 2

## Technical Details

### Auth.tsx changes (line 158-167):
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  // Skip password recovery events and non-login events
  if (event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED') return;
  if (session) {
    // Use setTimeout to avoid deadlock -- Supabase client calls
    // inside onAuthStateChange can deadlock the auth state resolution
    setTimeout(() => checkOnboardingAndRedirect(session), 0);
  }
});

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) checkOnboardingAndRedirect(session);
});
```

### Auth.tsx Google OAuth (line 292-294):
```typescript
const { error } = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: window.location.origin + '/auth',
});
```

### OnboardingGate.tsx changes:
Wrap the profile check to avoid deadlocking when triggered by `onAuthStateChange`:
```typescript
useEffect(() => {
  const checkOnboarding = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setChecking(false); return; }
    
    // Delay slightly to avoid deadlock with onAuthStateChange
    await new Promise(r => setTimeout(r, 100));
    
    // ... existing retry logic for profile query ...
  };
  checkOnboarding();
}, [navigate]);
```

