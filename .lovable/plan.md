## Problem

Clicking **Log in** (header, mobile menu, etc.) opens `/auth`, which currently defaults to the **Sign up** form. Users have to click an extra toggle to reach Sign in.

## Fix

1. **`src/pages/Auth.tsx`** — read `?mode=` from the URL on mount and initialize the form mode accordingly:
   - `?mode=login` → start in **Sign in**
   - `?mode=signup` → start in **Sign up**
   - `?mode=reset` / recovery hash → existing reset flow (unchanged)
   - No param → keep current default (**Sign up**) for organic landing traffic.

2. **`src/components/Header.tsx`** — point the two "Log in" buttons (desktop + mobile) at `/auth?mode=login`. Leave "Sign up" buttons as `/auth` (or `/auth?mode=signup`, equivalent).

3. Audit other call sites that mean "log in" specifically (e.g. `OnboardingGate`, `PaymentButton`, protected-route redirects) and append `?mode=login` so returning users land on Sign in. CTAs like "Start Free", "Get Started Free", "Try Features Free" stay on signup.

## Out of scope

- No backend / auth logic changes.
- No visual redesign of the Auth page.
- Reset-password and OAuth flows untouched.
