
# Plan: Hide Credit Balance on Landing Page

## Problem
The CreditBalance component shows in the header on the landing page, which isn't desired for the public-facing homepage.

## Solution
Add a simple conditional check to hide `CreditBalance` when the user is on the landing page route (`/`).

## File to Modify
`src/components/Header.tsx`

## Change
On line 168, wrap the CreditBalance in a conditional:

**Before:**
```tsx
<CreditBalance />
```

**After:**
```tsx
{location.pathname !== "/" && <CreditBalance />}
```

## Why This Works
- The `location` variable is already available from `useLocation()` hook on line 70
- No additional imports or state needed
- Simple, clean conditional rendering

## Result
- Landing page (`/`): No credit balance shown
- All other pages: Credit balance shows for logged-in users (existing auth check in CreditBalance still applies)
