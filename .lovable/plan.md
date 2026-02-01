
# Plan: Update Adsterra Ad Key to New Domain-Whitelisted Key

## Summary

You've successfully created a new Adsterra ad unit for `newtonai.lovable.app`. Now I'll update all ad components to use the new key:

**Old Key:** `c5d398ab0a723a7cfa61f3c2d7960602` (configured for different domain)
**New Key:** `fe9d10672684b2efb3db57ecdb954f85` (configured for `newtonai.lovable.app`)

---

## Files to Update

| File | Change |
|------|--------|
| `src/components/AdBanner.tsx` | Replace old key with new key (2 occurrences) |
| `src/components/PrimaryAdBanner.tsx` | Replace old key with new key (2 occurrences) |
| `supabase/functions/get-banner-ad/index.ts` | Replace old key constant with new key |

---

## Changes Detail

### 1. `src/components/AdBanner.tsx`

Update the `AD_HTML` constant:
- Line 26: `'key' : 'c5d398ab0a723a7cfa61f3c2d7960602'` → `'key' : 'fe9d10672684b2efb3db57ecdb954f85'`
- Line 33: `https://lozengehelped.com/c5d398ab0a723a7cfa61f3c2d7960602/invoke.js` → `https://lozengehelped.com/fe9d10672684b2efb3db57ecdb954f85/invoke.js`

### 2. `src/components/PrimaryAdBanner.tsx`

Update the `AD_HTML` constant:
- Line 25: `'key' : 'c5d398ab0a723a7cfa61f3c2d7960602'` → `'key' : 'fe9d10672684b2efb3db57ecdb954f85'`
- Line 32: `https://lozengehelped.com/c5d398ab0a723a7cfa61f3c2d7960602/invoke.js` → `https://lozengehelped.com/fe9d10672684b2efb3db57ecdb954f85/invoke.js`

### 3. `supabase/functions/get-banner-ad/index.ts`

Update the constant:
- Line 8: `const ADSTERRA_KEY = "c5d398ab0a723a7cfa61f3c2d7960602"` → `const ADSTERRA_KEY = "fe9d10672684b2efb3db57ecdb954f85"`

---

## Expected Result

After these changes:
- Ads will load successfully on `newtonai.lovable.app` (production)
- No more 403 Forbidden errors from Adsterra
- Banner ads will appear below upload sections and in promo sections

---

## Technical Note

The ad unit (Zone ID: 28523865) is already marked as **Active** in your Adsterra dashboard, so ads should start displaying immediately after the code update.
