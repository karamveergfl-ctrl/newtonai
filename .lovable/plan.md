

# Plan: Fix Black Space in Header from CreditBalance Component

## Problem
The `CreditBalance` component shows a black rectangular space in the header between "About" and the theme toggle. This happens because:

1. The component has an `isAuthenticated` state that starts as `null`
2. While `null`, the component continues to render the loading skeleton
3. The Skeleton component shows even when not authenticated

## Root Cause
In `CreditBalance.tsx`, the auth check flow is:
1. `isAuthenticated` starts as `null`
2. Auth check runs asynchronously
3. While `isAuthenticated === null`, it proceeds to show `<Skeleton />` during loading
4. This creates the visible black box

## Solution
Update `CreditBalance.tsx` to return `null` when authentication state is still being determined (`null`) OR when not authenticated (`false`).

## File to Modify
`src/components/CreditBalance.tsx`

## Change
Update the conditional check from:
```typescript
if (isAuthenticated === false) {
  return null;
}
```

To:
```typescript
// Don't render if not authenticated or still checking auth
if (isAuthenticated !== true) {
  return null;
}
```

This ensures the component renders nothing during:
- Initial load (when `isAuthenticated === null`)
- When user is not logged in (when `isAuthenticated === false`)

The component will only render when `isAuthenticated === true`.

## Result
- No black box will appear in the header for unauthenticated users
- Credit balance will only show after user is confirmed logged in
- Clean header appearance for all visitors

