

# Fix 100% Discount Code (newton100) Direct Activation

## Current State
The 100% discount bypass logic already exists in `PaymentButton.tsx` -- when `discountPercent === 100`, it skips Razorpay and calls the `activate-free-subscription` edge function. The subscription gets created and the user is redirected to the success page.

## Bug Found
The `apply_redeem_code` database function uses `auth.uid()` to get the user ID, but the edge function calls it using a **service role client** (which has no user auth context). This means `auth.uid()` returns `null`, and the code usage is **never recorded** -- the redemption silently fails.

## Fix

### 1. Fix Edge Function: `supabase/functions/activate-free-subscription/index.ts`
Replace the RPC call to `apply_redeem_code` with direct table operations using the service role client (which already has full access):

- **Insert into `redeemed_codes`** table directly with the user ID, code ID, discount percent, and payment ID
- **Update `redeem_codes`** table to increment `current_uses`

This bypasses the RPC's `auth.uid()` dependency entirely.

### 2. Update Success Page: `src/pages/payment/Success.tsx`
Change the heading from "Payment Successful!" to "Subscription Activated!" when the user arrives via a free code redemption. This can be done by checking for a URL query parameter (e.g., `?method=code`).

### 3. Update PaymentButton Navigation
When navigating to the success page after a 100% code activation, append `?method=code` so the success page can show appropriate messaging (e.g., "Your promo code was applied successfully!" instead of "Payment Successful!").

## Technical Details

### Edge Function Changes (`activate-free-subscription/index.ts`)
```text
Replace lines 122-131:
  // OLD: RPC call that fails due to no auth context
  await supabaseAdmin.rpc('apply_redeem_code', {...});

  // NEW: Direct table operations
  await supabaseAdmin.from('redeemed_codes').insert({
    user_id: user.id,
    code_id: redeem_code_id,
    discount_percent: 100,
    applied_to_payment_id: payment?.id
  });

  await supabaseAdmin.from('redeem_codes')
    .update({ current_uses: codeData.current_uses + 1, updated_at: new Date().toISOString() })
    .eq('id', redeem_code_id);
```

### PaymentButton Change (`src/components/PaymentButton.tsx`)
```text
// Change handleSuccess call to navigate with query param for free codes
navigate('/payment/success?method=code');
```

### Success Page Change (`src/pages/payment/Success.tsx`)
```text
// Read URL param and show appropriate title
const isCodeRedemption = searchParams.get('method') === 'code';

// Title: "Subscription Activated!" instead of "Payment Successful!"
// Description: "Your promo code was applied successfully!" instead of payment text
```

## Summary
- Fix the silent bug where code usage isn't recorded
- Show contextually appropriate success messaging for free code redemptions
- No changes to the overall flow -- it already correctly bypasses Razorpay for 100% codes

