
# Plan: Remove All Remaining Animations from Header Navigation Pages

## Overview
Remove all Framer Motion animations from the pages shown in the header navigation: **Home, Tools, Compare, Pricing, Blog, About, FAQ**. The goal is to eliminate all JavaScript-driven animations for maximum mobile performance.

## Current Animation Inventory

### Pages with Remaining Animations

| Page | File | Animation Types Found |
|------|------|----------------------|
| **Pricing** | `src/pages/Pricing.tsx` | motion.div for blobs, header, badges, controls, cards, table - **Heavy** |
| **Blog** | `src/pages/Blog.tsx` | motion.div for hero title, blog cards with staggered delays |
| **BlogPost** | `src/pages/BlogPost.tsx` | motion.div for content sections |
| **Landing** | Already cleaned | Static - no changes needed |
| **Tools** | Already cleaned | Static - no changes needed |
| **Compare** | Already cleaned | Static - no changes needed |
| **About** | Already cleaned | Static - no changes needed |
| **FAQ** | Already cleaned | Static - no changes needed |

### Components with Animations Still Used

| Component | File | Used By | Animation Types |
|-----------|------|---------|-----------------|
| **PricingCard** | `src/components/pricing/PricingCard.tsx` | Pricing | motion.div entrance, hover, feature stagger, badge animations |
| **FloatingBadge** | `src/components/FloatingBadge.tsx` | Various | Spring entrance animation |
| **ContextualFAQ** | `src/components/ContextualFAQ.tsx` | Tool pages | motion.div stagger, accordion animation |

---

## Files to Modify

### 1. Pricing Page (`src/pages/Pricing.tsx`)
**Lines with motion:** 1, 210-227, 233-270, 273-277, 292-302, 338-343, 345-360, 374, 409-414

**Changes:**
- Remove `motion` import
- Replace animated gradient blobs (lines 210-227) with static divs
- Replace `motion.div` header section with static `div`
- Replace animated badge with static badge
- Replace motion controls with static controls
- Replace motion redeem code section with static
- Replace motion feature comparison table with static
- Keep only CSS hover effects

### 2. PricingCard Component (`src/components/pricing/PricingCard.tsx`)
**Lines with motion:** 2, 92-106, 112-145, 148-159, 162-171, 188-196, 204-210, 223-232, 241-247

**Changes:**
- Remove `motion` and `AnimatePresence` imports
- Replace `motion.div` card wrapper with static `div`
- Keep AnimatePresence only for verifying payment overlay (essential UX)
- Replace animated popular badge with static
- Replace animated current plan badge with static
- Replace animated price display with static
- Replace animated billing box with static
- Replace animated feature list items with static
- Remove whileHover effects

### 3. Blog Page (`src/pages/Blog.tsx`)
**Lines with motion:** 2, 120-133, 147-153

**Changes:**
- Remove `motion` import
- Replace motion.div hero with static div
- Replace motion.div blog cards with static divs
- Keep CSS hover effects

### 4. BlogPost Page (`src/pages/BlogPost.tsx`)
**Lines with motion:** 2 (and various content sections)

**Changes:**
- Remove `motion` import
- Replace all motion.div sections with static divs

### 5. FloatingBadge Component (`src/components/FloatingBadge.tsx`)
**All lines use motion**

**Changes:**
- Remove `motion` import
- Replace motion.div with static div
- Remove spring animations

### 6. ContextualFAQ Component (`src/components/ContextualFAQ.tsx`)
**Lines with motion:** 3, 218-224, 232-237, 240-252, 260-267

**Changes:**
- Remove `motion` and `AnimatePresence` imports
- Replace motion.div FAQ items with static divs
- Keep accordion expand/collapse using CSS or Radix accordion
- Replace animated chevron with CSS rotation

---

## Technical Implementation Pattern

### Before (with animations):
```tsx
import { motion, AnimatePresence } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
  className="bg-card"
>
```

### After (static with CSS hover):
```tsx
<div className="bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
```

---

## What to Keep

- **Payment verification overlay** in PricingCard (essential UX - user needs feedback)
- **CSS hover effects** (lightweight, GPU-accelerated)
- **CSS transitions** (`transition-all duration-200`)

---

## Files to Modify Summary

| File | Priority | Scope |
|------|----------|-------|
| `src/pages/Pricing.tsx` | High | Major rewrite - 10+ motion elements |
| `src/components/pricing/PricingCard.tsx` | High | Card component - 8+ motion elements |
| `src/pages/Blog.tsx` | Medium | 3 motion elements |
| `src/pages/BlogPost.tsx` | Medium | Multiple motion elements |
| `src/components/FloatingBadge.tsx` | Low | 1 motion wrapper |
| `src/components/ContextualFAQ.tsx` | Low | 4 motion elements |

**Total: 6 files to modify**

---

## Expected Performance Improvement

- Eliminate 25+ JavaScript-driven animations on Pricing page alone
- Remove staggered entrance delays causing delayed content visibility
- Eliminate Framer Motion intersection observer overhead on Blog page
- Reduce main thread work significantly on mobile devices
- Content will render instantly instead of animating in
