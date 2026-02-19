

## Polish Logo: Unified Horizontal Logo with Border Ring

### What Changes

The reference image shows:
- The circular mascot icon with a subtle border/ring around it
- "NewtonAI" as a single cohesive text (not split into two separate gradient styles)
- Clean teal/green color matching the brand
- Everything on the same tight horizontal line

### Changes to `src/components/Logo.tsx`

1. **Add a border ring** to the icon container: `ring-2 ring-primary/30` gives the icon a subtle branded outline, matching the reference.

2. **Unify the text** into a single "NewtonAI" word instead of split "Newton" + "AI" with different gradients:
   - "Newton" keeps the primary-to-emerald gradient, extrabold
   - "AI" uses the same gradient direction (not reversed) and same weight, so it reads as one cohesive word
   - Remove the underline accent bar under "AI" -- the reference doesn't have it
   - Use `gap-0` with no tracking difference between the two spans so they look like one word

3. **Tighten gap** between icon and text from `gap-1.5` to `gap-2` for better visual spacing.

### Technical Details

| File | Change |
|------|--------|
| `src/components/Logo.tsx` | Add `ring-2 ring-primary/30` to icon container; unify text gradient direction; remove AI underline accent; adjust spacing |

No changes needed in Header.tsx or AppSidebar.tsx -- they already use the Logo component.
