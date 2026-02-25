

# Institutional Subscription Model

## Overview
Add institution-level licensing with per-student and teacher-bundle pricing, an admin billing dashboard, and feature gating tied to the institution's subscription tier. This extends the existing individual subscription system (free/pro/ultra) with a parallel institution-level tier system.

---

## Phase 1: Database Migration

Single migration to create the institutional subscription tables and RPCs.

### 1.1 `institution_subscriptions` Table
Stores the institution's active plan and seat counts.

```text
institution_subscriptions
  id                    uuid PK DEFAULT gen_random_uuid()
  institution_id        uuid NOT NULL UNIQUE (FK -> institutions.id)
  plan_tier             text NOT NULL DEFAULT 'starter'   -- starter, growth, enterprise
  student_seats         integer NOT NULL DEFAULT 50
  teacher_seats         integer NOT NULL DEFAULT 5
  price_per_student     numeric NOT NULL DEFAULT 0
  price_per_teacher     numeric NOT NULL DEFAULT 0
  billing_cycle         text NOT NULL DEFAULT 'monthly'
  status                text NOT NULL DEFAULT 'active'
  current_period_start  timestamptz DEFAULT now()
  current_period_end    timestamptz
  created_at            timestamptz DEFAULT now()
  updated_at            timestamptz DEFAULT now()
```

RLS: SELECT/UPDATE for institution admins only via `is_institution_admin`. No direct INSERT/DELETE (managed via edge function).

### 1.2 `institution_payments` Table
Tracks payment history for the institution.

```text
institution_payments
  id                  uuid PK DEFAULT gen_random_uuid()
  institution_id      uuid NOT NULL
  subscription_id     uuid NOT NULL (FK -> institution_subscriptions.id)
  amount              integer NOT NULL
  currency            text DEFAULT 'INR'
  razorpay_order_id   text
  razorpay_payment_id text
  status              text NOT NULL DEFAULT 'created'
  billing_period_start timestamptz
  billing_period_end   timestamptz
  created_at          timestamptz DEFAULT now()
```

RLS: SELECT only for institution admins. No direct INSERT/UPDATE/DELETE.

### 1.3 New RPCs

**`get_institution_billing_stats(p_institution_id uuid)`** (SECURITY DEFINER)
Returns:
- Current plan details (tier, seats, pricing)
- Active student count vs allocated seats
- Active teacher count vs allocated seats
- Payment history summary (total paid, last payment date)
- Seat utilization percentages

**`get_institution_feature_access(p_institution_id uuid)`** (SECURITY DEFINER)
Returns feature access map based on institution tier:
- Starter: Basic classroom, limited live sessions, no AI insights
- Growth: Full classroom, AI insights, result processing, 100 live sessions/month
- Enterprise: Unlimited everything, priority support, custom branding

---

## Phase 2: Institution Tier Configuration

### Feature access per tier (defined in code, not DB):

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| Live Sessions/month | 20 | 100 | Unlimited |
| AI Insights | No | Yes | Yes |
| Result Processing | Basic | Full | Full |
| Faculty Monitoring | No | Yes | Yes |
| Compliance/Audit | No | Basic | Full |
| Report Card PDFs | 50/month | 500/month | Unlimited |
| Student Seats | Up to 50 | Up to 500 | Unlimited |
| Teacher Seats | Up to 5 | Up to 50 | Unlimited |

**File:** `src/lib/institutionTierConfig.ts` -- Defines tier limits and pricing constants.

---

## Phase 3: Hooks

**File:** `src/hooks/useInstitutionSubscription.ts`
- Fetches the institution's subscription from `institution_subscriptions`
- Returns: tier, seats, utilization, feature access map
- Uses `useInstitution` to get institution_id

**File:** `src/hooks/useInstitutionFeatureGate.ts`
- Checks if a specific feature is available for the institution's tier
- Returns `canUse`, `tierRequired`, and upgrade prompt info
- Used by institution pages to gate features

---

## Phase 4: Admin Billing Dashboard

**File:** `src/pages/institution/InstitutionBillingPage.tsx`

Tabbed layout with 3 sections:

### 4.1 Subscription Overview Tab
- Current plan card (tier, pricing, renewal date)
- Seat utilization bars (students: X/Y used, teachers: X/Y used)
- Upgrade/downgrade buttons
- Plan comparison table

### 4.2 Usage Analytics Tab
- Monthly active students chart (recharts line chart)
- Live sessions consumed vs limit
- Feature usage breakdown per tier feature
- Seat growth trend

### 4.3 Payment History Tab
- Paginated table of `institution_payments`
- Columns: date, amount, status, billing period, invoice download
- Filter by date range
- Total spent summary card

---

## Phase 5: Feature Gating Integration

**File:** `src/components/institution/InstitutionFeatureGate.tsx`
- Wraps institution page sections that require a certain tier
- Shows locked overlay with "Upgrade to Growth/Enterprise" CTA for gated features
- Uses `useInstitutionFeatureGate` hook

Integration points (modify existing pages):
- `InstitutionAnalyticsPage.tsx`: AI Insights tab gated behind Growth tier
- `ResultProcessingPage.tsx`: Batch PDF generation gated by tier limits
- `FacultyMonitoringPage.tsx`: Entire page gated behind Growth tier
- `CompliancePage.tsx`: Full audit log gated behind Enterprise tier

---

## Phase 6: Pricing Edge Functions

**File:** `supabase/functions/institution-create-order/index.ts`
- Calculates total price: (student_seats * price_per_student) + (teacher_seats * price_per_teacher)
- Applies billing cycle discount (yearly = 20% off)
- Creates Razorpay order
- Inserts pending `institution_payments` record

**File:** `supabase/functions/institution-verify-payment/index.ts`
- Verifies Razorpay signature (same pattern as individual verify)
- Updates `institution_payments` status
- Creates/updates `institution_subscriptions` record
- Logs audit entry via `log_institution_audit`

---

## Phase 7: Route & Navigation

- Add route `/institution/billing` in `App.tsx` under `InstitutionRoute`
- Add "Billing" sidebar link in `AppSidebar.tsx` under Institution section (CreditCard icon)

---

## Files Summary

### New Files (7)
1. `supabase/migrations/[timestamp]_institution_subscriptions.sql` -- Tables, RLS, RPCs
2. `src/lib/institutionTierConfig.ts` -- Tier definitions and pricing
3. `src/hooks/useInstitutionSubscription.ts` -- Subscription data hook
4. `src/hooks/useInstitutionFeatureGate.ts` -- Feature gating hook
5. `src/pages/institution/InstitutionBillingPage.tsx` -- Billing dashboard
6. `src/components/institution/InstitutionFeatureGate.tsx` -- Gate component
7. `supabase/functions/institution-create-order/index.ts` -- Order creation
8. `supabase/functions/institution-verify-payment/index.ts` -- Payment verification

### Modified Files (5)
1. `src/App.tsx` -- Add billing route
2. `src/components/AppSidebar.tsx` -- Add Billing sidebar link
3. `src/pages/institution/InstitutionAnalyticsPage.tsx` -- Gate AI Insights tab
4. `src/pages/institution/FacultyMonitoringPage.tsx` -- Gate behind Growth tier
5. `src/pages/institution/CompliancePage.tsx` -- Gate audit features behind Enterprise

### Security
- All tables use strict RLS with `is_institution_admin` checks
- No direct client INSERT/DELETE on subscription or payment tables
- Payment verification is server-side only (edge function with HMAC)
- Feature gating is enforced both client-side (UI) and server-side (RPCs check tier before returning data)
- Audit logging for all billing actions

