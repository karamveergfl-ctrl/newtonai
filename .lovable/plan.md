

# Add Pitch Deck Link to Landing Page and Header Navigation

## What Changes

### 1. Add "Pitch Deck" link to the Header navigation
Add a new entry in the **Resources** dropdown menu in `src/components/Header.tsx` so visitors can find the pitch deck from any page.
- Label: "Pitch Deck" with a "NEW" badge
- Links to `/pitch-deck`

### 2. Add a Pitch Deck CTA section on the Landing Page
Add a new section in `src/pages/LandingPage.tsx` just before the Final CTA section. This will be a visually distinct banner inviting Deans, Principals, and HODs to view the pitch deck.
- Heading: "Are You a Dean or Administrator?"
- Subtext: "See how NewtonAI transforms your smart boards into a complete Classroom OS"
- Button: "View Pitch Deck" linking to `/pitch-deck`
- Styled with a gradient border or accent background to stand out

---

## Technical Details

### File: `src/components/Header.tsx`
- Add `{ href: "/pitch-deck", label: "Pitch Deck", badge: "NEW" }` to the `Resources` dropdown children array (around line 47-51)

### File: `src/pages/LandingPage.tsx`
- Import `Presentation` icon from `lucide-react`
- Add a new section before the Final CTA (before line 442) with:
  - Dark gradient background to differentiate from other sections
  - Presentation icon + heading + description + CTA button linking to `/pitch-deck`

