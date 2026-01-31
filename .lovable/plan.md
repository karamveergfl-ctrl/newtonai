
# Plan: Fix Feature Access for Ultra/Pro Users During Loading States

## Problem Identified

The current implementation has a **race condition** where Ultra/Pro users may see the "Study Credits Needed" modal because both gating systems (`useCredits` and `useFeatureLimitGate`) default to `free` status while loading:

| State | isPremiumCredits | subscription.tier | isPremium (computed) | Result |
|-------|-----------------|-------------------|---------------------|--------|
| Both loading | false | "free" | false | ❌ Modal shown incorrectly |
| Credits loaded first | true | "free" | true | ✅ Works |
| Subscription loaded first | false | "ultra" | true | ✅ Works |
| Both loaded | true | "ultra" | true | ✅ Works |

The issue occurs when a user clicks a button before either system finishes loading.

---

## Solution

Update the premium check logic to:
1. If **either** system is still loading, assume premium status until confirmed
2. Only show the modal when **both** systems have finished loading AND confirm the user is not premium

### Technical Approach

Modify the `trySpendCredits` function in both `Index.tsx` and `AISummarizer.tsx` to wait for loading to complete before blocking:

```typescript
// If either system is still loading, don't block - assume premium
if (creditsLoading || subscriptionLoading) {
  // Could also check subscription tier from CreditsContext as backup
  return true;
}
```

Or alternatively, use a unified approach that properly handles loading states.

---

## Files to Modify

### 1. `src/pages/Index.tsx`

**Location:** Lines 252-278 (trySpendCredits function)

**Changes:**
- Add `loading` from the feature usage hook
- Update the premium check to also wait for feature usage to load
- Only block users when both systems confirm free tier

**Updated code:**
```typescript
// Get subscription tier for reliable premium check
const [subscriptionTier, setSubscriptionTier] = useState<"free" | "pro" | "ultra">("free");
const [subscriptionLoading, setSubscriptionLoading] = useState(true);

useEffect(() => {
  const fetchSubscriptionTier = async () => {
    if (session?.user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", session.user.id)
        .single();
      if (profile?.subscription_tier) {
        setSubscriptionTier(profile.subscription_tier as "free" | "pro" | "ultra");
      }
    }
    setSubscriptionLoading(false);
  };
  fetchSubscriptionTier();
}, [session?.user?.id]);

// Consider user premium if EITHER system says so (Ultra or Pro/Premium)
const isPremium = isPremiumCredits || subscriptionTier === "ultra" || subscriptionTier === "pro";

// Helper function to check and spend credits
const trySpendCredits = async (feature: string): Promise<boolean> => {
  // Check premium from both systems - ultra/pro bypass credits
  if (isPremium) return true;
  
  // If EITHER system is still loading, don't block (premium check incomplete)
  if (creditsLoading || subscriptionLoading) return true;
  
  // Both systems loaded and user is free tier - check credits
  if (!hasEnoughCredits(feature)) {
    setBlockedFeature(feature);
    setShowCreditModal(true);
    return false;
  }
  
  const success = await spendCredits(feature);
  if (success) {
    const cost = FEATURE_COSTS[feature];
    toast({
      title: `${cost} credits used`,
      description: FEATURE_NAMES[feature]
    });
  }
  return success;
};
```

### 2. `src/pages/tools/AISummarizer.tsx`

**Location:** Lines 200-270 (credits and trySpendCredits)

**Changes:**
- Use `loading` from `useFeatureLimitGate` (already returned)
- Update premium check to wait for both systems

**Updated code:**
```typescript
const { 
  credits, 
  hasEnoughCredits, 
  spendCredits, 
  isPremium: isPremiumCredits,
  loading: creditsLoading 
} = useCredits();

// Get loading state from feature limit gate
const { tryUseFeature, confirmUsage, feature, showLimitModal, setShowLimitModal, subscription, loading: subscriptionLoading } = useFeatureLimitGate("summary");

// Consider user premium if EITHER system says so (Ultra or Pro/Premium)
const isPremium = isPremiumCredits || subscription.tier === "ultra" || subscription.tier === "pro";

// Helper function to check and spend credits
const trySpendCredits = async (feature: string): Promise<boolean> => {
  // Check premium from both systems - ultra/pro bypass credits
  if (isPremium) return true;
  
  // If EITHER system is still loading, don't block (premium check incomplete)
  if (creditsLoading || subscriptionLoading) return true;
  
  // Both systems loaded and user is free tier - check credits
  if (!hasEnoughCredits(feature)) {
    setBlockedFeature(feature);
    setShowCreditModal(true);
    return false;
  }
  
  // ... rest of function
};
```

---

## Summary

| File | Change | Purpose |
|------|--------|---------|
| `src/pages/Index.tsx` | Add `subscriptionLoading` state, update `trySpendCredits` | Prevent blocking while loading |
| `src/pages/tools/AISummarizer.tsx` | Use `loading` from `useFeatureLimitGate`, update `trySpendCredits` | Prevent blocking while loading |

This ensures Ultra/Pro users are **never incorrectly blocked** due to loading race conditions. The worst case is that a free user might bypass one credit check while loading, which is acceptable compared to blocking paying users.

---

## Testing Checklist

After the fix:
1. Log in as an Ultra user
2. Immediately try to generate a summary from a YouTube video
3. The modal should NOT appear
4. The feature should work without any credit prompts
5. Test with Pro users as well
6. Test that free users still see the modal when they have 0 credits
