# Light Theme Polish — Pearl & Sky

Scope: **global tokens only** in `src/index.css` (and a minor token addition in `tailwind.config.ts` if needed). No per-page edits, no component rewrites — every page automatically inherits the refined look.

## Palette (light mode only)

Refined Pearl & Sky tokens, keeping the existing teal primary for brand continuity but layering soft sky-blue gradients and pearl surfaces.

- `--background`: `210 40% 99%` (pearl white, very subtle cool tint)
- `--foreground`: `222 47% 11%` (deep slate, stronger contrast)
- `--card`: `0 0% 100%` with subtle border
- `--muted`: `214 32% 96%` (cool pearl)
- `--muted-foreground`: `215 20% 40%` (better readability than current 47%)
- `--border`: `214 32% 90%` (slightly softer)
- `--primary`: keep teal `173 80% 35%`
- `--secondary`: refine to soft sky `213 94% 68%`
- `--ring`: subtle sky `213 94% 68%`

## Gradients (light mode)

Replace flat/teal-heavy gradients with layered pearl-to-sky washes:

- `--gradient-hero`: `linear-gradient(135deg, hsl(210 40% 99%) 0%, hsl(214 95% 93%) 50%, hsl(213 94% 85%) 100%)` — airy hero washes
- `--gradient-card`: `linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(214 32% 98%) 100%)` — soft pearl on cards
- `--gradient-accent`: `linear-gradient(135deg, hsl(213 94% 68%), hsl(199 89% 75%))` — sky blue
- Add `--gradient-subtle`: `linear-gradient(180deg, hsl(210 40% 99%), hsl(214 32% 96%))` — page backgrounds
- Add `--gradient-primary`: `linear-gradient(135deg, hsl(173 80% 35%), hsl(173 80% 45%))` — keep teal CTAs

## Shadows (light mode)

Replace harsh dark drop shadows with soft, layered, slightly cool shadows for a premium SaaS feel:

- `--shadow-card`: `0 1px 2px hsl(214 32% 70% / 0.08), 0 4px 12px hsl(214 32% 70% / 0.08)`
- `--shadow-elevated`: `0 4px 16px hsl(214 32% 60% / 0.12), 0 12px 32px hsl(214 32% 60% / 0.10)`
- `--shadow-glow`: `0 0 32px hsl(213 94% 68% / 0.25)` — sky glow instead of teal

## Scrollbar

Lighten the global `::-webkit-scrollbar-thumb` from `hsl(215 20% 35%)` (very dark, looks broken on light bg) to `hsl(215 20% 75%)` with hover `hsl(215 20% 60%)`. Dark mode unchanged via media query or keep as-is (current value works on dark).

## What stays unchanged

- Dark mode tokens — untouched
- Tailwind config — no changes (semantic tokens already exposed)
- All component files — untouched
- Brand primary teal — preserved for CTAs/logo continuity

## Files

- `src/index.css` — only file modified

## Verification

After edit: visit Landing, Pricing, Tools, Dashboard in light mode via preview to confirm gradients render and contrast remains AA-compliant. Dark mode should be visually identical to before.