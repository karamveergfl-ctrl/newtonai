
# Plan: Fix Free Tier Date Mismatch Bug

## Problem Identified

The free tier isn't working because of a **timezone bug** causing date mismatches between the frontend and database.

### Root Cause

**Frontend (useFeatureUsage.ts line 105):**
```javascript
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
// Returns: "2025-12-31" (wrong - due to UTC conversion)
```

**Database (track_feature_usage function):**
```sql
v_period_start := date_trunc('month', now())::date;
-- Returns: "2026-01-01" (correct)
```

When a user in a timezone like IST (+5:30) creates a date for "January 1st midnight local time" and converts to ISO string (UTC), it shifts back to December 31st. The frontend then queries for records with `period_start=2025-12-31`, but the database has `period_start=2026-01-01`.

**Result:** Usage data returns empty, making the system think users have 0 usage.

---

## Solution

Fix the date calculation in `useFeatureUsage.ts` to use **UTC-based dates** that match the database:

### File to Modify

**`src/hooks/useFeatureUsage.ts`**

**Current Code (lines 104-105):**
```javascript
const today = new Date().toISOString().split("T")[0];
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
```

**Fixed Code:**
```javascript
// Use UTC dates to match database date_trunc behavior
const now = new Date();
const today = now.toISOString().split("T")[0];
const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split("T")[0];
```

This ensures:
- `Date.UTC()` creates the date directly in UTC
- No timezone offset is applied during conversion
- The resulting string `2026-01-01` matches what the database stores

---

## Technical Details

| Component | Before (Bug) | After (Fix) |
|-----------|-------------|-------------|
| User timezone | IST (+5:30) | IST (+5:30) |
| Local midnight | Jan 1, 00:00 IST | Jan 1, 00:00 IST |
| UTC conversion | Dec 31, 18:30 UTC | Jan 1, 00:00 UTC |
| String result | "2025-12-31" | "2026-01-01" |
| DB query match | No | Yes |

---

## Testing Checklist

After the fix:
1. Free tier users should see their correct usage counts
2. Usage limits should properly block features when limits are reached
3. The usage limit modal should appear when a user hits their limit
4. Works correctly regardless of user's timezone

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useFeatureUsage.ts` | Modify | Fix date calculation to use UTC |

This is a one-line fix that resolves the timezone mismatch issue.
