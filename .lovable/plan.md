
# Fix Inconsistent Headers on Refund and Terms Pages

## Problem
The Refund and Terms pages use custom inline headers with limited navigation (only About, Pricing, Contact, FAQ links and a "Sign In" button), while all other landing pages use the shared `Header` component with full navigation (Home, Features dropdown, Tools, Resources dropdown, Pricing, About, theme toggle, Log in, Sign up).

## Solution
Replace the custom inline `<header>` blocks in both `Refund.tsx` and `Terms.tsx` with the shared `Header` component, matching every other landing page.

## Files to Modify

### 1. `src/pages/Refund.tsx`
- Replace `import Logo from "@/components/Logo"` with `import Header from "@/components/Header"`
- Remove the custom `<header>...</header>` block (lines 30-52) and replace with `<Header />`
- The spacer div is already built into the `Header` component, so no extra spacing needed

### 2. `src/pages/Terms.tsx`
- Replace `import Logo from "@/components/Logo"` with `import Header from "@/components/Header"`
- Remove the `import { Link } from "react-router-dom"` only if no other `Link` usage exists (it does exist elsewhere, so keep it)
- Remove the custom `<header>...</header>` block (lines 29-51) and replace with `<Header />`

Both pages will then show the same full navigation header as the About page and all other landing pages.
