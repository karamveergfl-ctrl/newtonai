

# Plan: Consolidate Header Navigation with Dropdowns

## Problem
The header currently has 10 navigation links which creates a cluttered appearance:
- Home, Features, How It Works, Tools, Guides, Compare, Pricing, Blog, About, FAQ

## Solution: Group Related Pages into Dropdowns

Reduce from **10 top-level items** to **6 items** by creating logical groupings:

### New Navigation Structure

| Position | Item | Type | Contains |
|----------|------|------|----------|
| 1 | Home | Link | / |
| 2 | Features | Dropdown | Features, How It Works, Compare |
| 3 | Tools | Link | /tools |
| 4 | Resources | Dropdown | Guides (NEW), Blog, FAQ |
| 5 | Pricing | Link | /pricing |
| 6 | About | Link | /about |

### Visual Layout (Desktop)

```text
[Logo] Home | Features ▾ | Tools | Resources ▾ | Pricing | About | [Credits] [Theme] [Login] [Signup]
```

### Dropdown Contents

**Features Dropdown:**
- Features → /features
- How It Works → /how-it-works
- Compare → /compare

**Resources Dropdown:**
- Guides (NEW badge) → /guides
- Blog → /blog
- FAQ → /faq

---

## Technical Implementation

### File to Modify
`src/components/Header.tsx`

### Changes Required

1. **Add Radix DropdownMenu imports**
   - Import `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` from `@/components/ui/dropdown-menu`
   - Import `ChevronDown` icon from lucide-react

2. **Restructure navLinks array**
   - Change from flat array to support nested items
   - Add `type: "link" | "dropdown"` and optional `children` array

3. **Update desktop navigation rendering**
   - Render regular links for simple items
   - Render dropdown menus for items with children
   - Style dropdown triggers to match existing nav link styling
   - Style dropdown content with proper dark/light theme support

4. **Keep mobile menu flat**
   - Mobile menu will show all items in a flat list (better UX on mobile)
   - No nested menus on mobile

---

## New navLinks Structure

```text
navLinks = [
  { href: "/", label: "Home", type: "link" },
  { 
    label: "Features", 
    type: "dropdown",
    children: [
      { href: "/features", label: "Features" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/compare", label: "Compare" },
    ]
  },
  { href: "/tools", label: "Tools", type: "link" },
  { 
    label: "Resources", 
    type: "dropdown",
    children: [
      { href: "/guides", label: "Guides", badge: "NEW" },
      { href: "/blog", label: "Blog" },
      { href: "/faq", label: "FAQ" },
    ]
  },
  { href: "/pricing", label: "Pricing", type: "link" },
  { href: "/about", label: "About", type: "link" },
]
```

---

## Mobile Menu Behavior

The mobile menu will display all items in a flat list for better usability:
- Home
- Features
- How It Works
- Tools
- Guides (NEW)
- Compare
- Pricing
- Blog
- About
- FAQ

This maintains easy touch navigation while keeping the desktop header clean.

---

## Summary

| Before | After |
|--------|-------|
| 10 top-level nav items | 6 top-level items |
| Cluttered header | Clean, organized navigation |
| All items visible | Related pages grouped logically |
| No dropdowns | 2 dropdowns (Features, Resources) |

