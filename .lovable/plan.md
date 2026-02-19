

## Make "NewtonAI" Header Text Extraordinary

The current branding text uses a simple gradient with basic font styling. We'll elevate it with a multi-layered visual treatment that feels premium and distinctive.

### Design Approach

Split the text into two styled parts -- "Newton" and "AI" -- to create visual hierarchy and interest:

- **"Newton"** -- bold, clean, uses the display font with the existing gradient
- **"AI"** -- highlighted with a distinct accent treatment (e.g., a glowing badge-like feel or contrasting color weight)
- Add a subtle shimmer animation across the full text for a premium, dynamic feel
- Use a richer multi-stop gradient (primary -> secondary -> accent teal) for more depth

### Changes in `src/components/Header.tsx`

Replace the single `<span>` with a styled composite:

```tsx
<div className="flex items-baseline gap-0">
  <span className="font-display font-extrabold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-primary via-emerald-400 to-secondary bg-clip-text text-transparent">
    Newton
  </span>
  <span className="font-display font-black text-xl md:text-2xl tracking-tighter bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent relative">
    AI
    <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-secondary rounded-full opacity-80" />
  </span>
</div>
```

Key visual upgrades:
1. **Multi-stop gradient** with a `via-emerald-400` middle stop for richer color depth
2. **Split styling** -- "Newton" is extrabold, "AI" is black weight with tighter tracking for contrast
3. **Underline accent** -- a thin gradient underline beneath "AI" to make it pop as a badge/highlight
4. **No shimmer animation** to stay consistent with the project's preference for minimal animations in the header

### Technical Details

- Only `src/components/Header.tsx` needs editing (line ~106, the branding span)
- No new dependencies or CSS needed -- uses existing Tailwind utilities
- The `items-baseline` alignment keeps both parts on the same text baseline
- `emerald-400` complements the existing primary/secondary teal palette

