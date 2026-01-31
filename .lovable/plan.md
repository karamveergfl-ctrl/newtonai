

# Plan: Fix Ultra Plan Access Not Working

## Problem Identified

Ultra users are incorrectly seeing the "Study Credits Needed" modal because there are **two separate gating systems** that aren't synchronized:

| System | Hook | Premium Check | Used For |
|--------|------|---------------|----------|
| Feature Limits | `useFeatureLimitGate` | `subscription.tier === "ultra"` | Non-video content |
| Credits | `useCredits` | `isPremium` from CreditsContext | Video-based generation |

The video generation functions (`handleGenerateFlashcardsFromVideo`, `handleGenerateSummaryFromVideo`, etc.) use `trySpendCredits()` which relies on `isPremium` from `CreditsContext`. This value may be `false` even for Ultra users if:

1. The context hasn't finished loading
2. There's any error in the profile fetch
3. The user's session isn't fully established when the context initializes

## Solution

**Unify the gating logic** by making the `trySpendCredits` function also check the subscription tier from `useFeatureUsage`, or alternatively, update all video generation functions to use `useFeatureLimitGate` for consistency.

### Recommended Approach: Update `trySpendCredits` to use both systems

This is the minimal change approach that fixes the issue without refactoring the entire flow.

---

## Files to Modify

### 1. `src/pages/tools/AISummarizer.tsx`

**Current code (lines 200-205):**
```typescript
const { 
  credits, 
  hasEnoughCredits, 
  spendCredits, 
  isPremium 
} = useCredits();
```

**Updated code:**
```typescript
const { 
  credits, 
  hasEnoughCredits, 
  spendCredits, 
  isPremium: isPremiumCredits,
  loading: creditsLoading 
} = useCredits();

// Get subscription tier from feature usage for reliable premium check
const { subscription } = useFeatureUsage();

// Consider user premium if EITHER system says so (Ultra or Pro/Premium)
const isPremium = isPremiumCredits || subscription.tier === "ultra" || subscription.tier === "pro";
```

**Updated `trySpendCredits` function (around line 241):**
```typescript
// Helper function to check and spend credits
const trySpendCredits = async (feature: string): Promise<boolean> => {
  // Check premium from both systems - ultra/pro bypass credits
  if (isPremium) return true;
  
  // If credits system is still loading, wait or use feature limit system
  if (creditsLoading) {
    // Fall back to subscription check
    if (subscription.tier !== "free") return true;
  }
  
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

### 2. `src/pages/Index.tsx`

Apply the same changes to the Index page which has similar `trySpendCredits` logic for video generation features.

### 3. `src/contexts/CreditsContext.tsx` (Alternative/Additional Fix)

Add an else clause to explicitly set `isPremium` to false and also add a fallback when no subscription tier is found:

**Current code (lines 72-76):**
```typescript
// Check for any paid tier (pro, premium, ultra)
const paidTiers = ['pro', 'premium', 'ultra'];
if (profile?.subscription_tier && paidTiers.includes(profile.subscription_tier)) {
  setIsPremium(true);
}
```

**Updated code:**
```typescript
// Check for any paid tier (pro, premium, ultra)
const paidTiers = ['pro', 'premium', 'ultra'];
if (profile?.subscription_tier && paidTiers.includes(profile.subscription_tier)) {
  setIsPremium(true);
} else {
  setIsPremium(false);
}
```

---

## Testing Checklist

After the fix:
1. Log in as an Ultra user
2. Navigate to AI Summarizer
3. Load a YouTube video
4. Click "Generate Summary" or any other study tool
5. The modal should NOT appear for Ultra users
6. The feature should generate directly without credit prompts

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/tools/AISummarizer.tsx` | Modify | Add subscription tier check from useFeatureUsage |
| `src/pages/Index.tsx` | Modify | Same changes for consistency |
| `src/contexts/CreditsContext.tsx` | Modify | Add explicit else clause for isPremium |

This fix ensures that Ultra/Pro users are never blocked by the credits system, regardless of which hook loads first.

