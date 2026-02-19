

## Unify and Polish the NewtonAI Logo + Text Across Header and Sidebar

### Problem
The logo + branding text is styled differently in the header vs sidebar. The sidebar uses the Logo component's basic `showText` prop (plain gradient text), while the header has a custom split "Newton" + "AI" treatment. Neither looks perfectly fitted.

### Approach
Move the premium split branding text INTO the Logo component itself, so both header and sidebar get the same polished treatment automatically. Adjust sizes so everything fits the compact header (h-12/h-14) and sidebar header naturally.

### Changes

#### 1. `src/components/Logo.tsx` -- Embed the branded text treatment

Update the `showText` rendering to use the same split "Newton" + "AI" styling with the gradient underline accent. Add a size-aware text class so it scales properly:

- `xs` / `sm` sizes: `text-lg` for the text (fits header/sidebar)
- `md` / `lg` sizes: `text-2xl` / `text-3xl` for landing pages

The branded text will render as:
- "Newton" in extrabold with a 3-stop gradient (primary -> emerald-400 -> secondary)
- "AI" in black weight with tighter tracking + gradient underline accent

Adjust the logo icon sizes slightly for better fit:
- `xs`: 32px (mobile header)
- `sm`: 36px (desktop header + sidebar)

#### 2. `src/components/Header.tsx` -- Simplify to use Logo's built-in text

Replace the custom logo + text block (lines 104-115) with a single `<Logo>` call:
```
<Logo size={isMobile ? "xs" : "sm"} showText compact />
```

This removes the duplicated branding markup from the header entirely.

#### 3. `src/components/AppSidebar.tsx` -- Already uses `showText={true}`

Line 148 already renders `<Logo size="sm" showText={true} />`. With the Logo component updated, this will automatically get the polished treatment. No changes needed here -- it just works.

### Result
- One source of truth for the "NewtonAI" branding treatment
- Consistent, polished look in header AND sidebar
- Logo icon and text sized to fit snugly within the h-12/h-14 header and sidebar header
- The split gradient text with AI underline accent appears everywhere

### Technical Details

| File | Change |
|------|--------|
| `src/components/Logo.tsx` | Update `showText` rendering with split "Newton"/"AI" branded text; adjust icon sizes for xs/sm |
| `src/components/Header.tsx` | Replace lines 104-115 with single `<Logo size={isMobile ? "xs" : "sm"} showText compact />` |
| `src/components/AppSidebar.tsx` | No changes needed -- already uses `<Logo size="sm" showText={true} />` |
