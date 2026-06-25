# Light Theme Polish

Goal: Make the light UI feel calmer, more premium, and easier on the eyes — without touching dark mode or any business logic.

## Scope
Only `src/index.css` `:root` tokens (light theme) and, if needed, light-mode overrides in `src/App.css`. No component refactors. Dark mode untouched.

## Visual changes

1. **Background system**
   - Shift `--background` from cool blue-white to a softer warm-neutral (very subtle, near-white) for less eye strain.
   - Layer a faint gradient (`--gradient-hero`) using soft sky + lavender tints instead of the current heavier blue.
   - `--gradient-subtle` becomes a near-flat off-white gradient for section backgrounds.

2. **Surfaces & cards**
   - `--card` stays pure white but `--gradient-card` gets a very subtle top-to-bottom tint so cards lift off the page.
   - Soften `--border` (lower saturation, slightly lighter) so dividers feel less harsh.
   - `--muted` warmed slightly to pair with the new background.

3. **Primary / accent**
   - Keep teal `--primary` but nudge to a slightly deeper, more readable shade for AA contrast on white.
   - `--secondary` (blue) softened toward a refined indigo-sky so primary teal remains the hero color.
   - `--accent` amber slightly desaturated for a more premium feel.

4. **Shadows & depth**
   - Replace flat gray shadows with tinted shadows (cool-neutral) at low opacity — softer, more diffused, two-layer.
   - `--shadow-glow` tied to primary at lower intensity.

5. **Text contrast**
   - `--muted-foreground` darkened a step for WCAG AA on light surfaces.
   - `--foreground` kept deep navy for strong hierarchy.

6. **Scrollbar (light only)**
   - Lighter, semi-transparent thumb matching the new neutral palette.

## Out of scope
- Dark theme tokens
- Component markup / Tailwind classes in components
- Animations, layouts, copy
- Pitch deck & classroom themes

## Verification
- Visit `/`, `/tools`, `/tools/quiz`, `/pricing`, `/auth`, `/teacher` dashboard in light mode via Playwright screenshots at 1280×1800; confirm contrast, card lift, and gradient softness.
- Confirm dark mode screenshots are unchanged.
