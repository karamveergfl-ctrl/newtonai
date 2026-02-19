
## Fix Logo Overflow and Upgrade Branding Text

### Problem
The logo icon is 60px (mobile) / 72px (desktop) but the header is only 48px / 56px tall, causing the logo to overflow and get clipped by the screen boundary. The "NewtonAI" text also needs a more refined, professional appearance.

### Changes

**1. Reduce logo sizes in `src/components/Logo.tsx`**
- Change `xs` icon from 60px to 36px (fits within 48px header with padding)
- Change `sm` icon from 72px to 42px (fits within 56px header with padding)
- Remove negative margins for the compact variant since the image no longer needs compensation
- Keep `md` and `lg` sizes unchanged (used on landing page, not header)

**2. Upgrade "NewtonAI" branding text in `src/components/Header.tsx`**
- Switch to the `font-display` family (Plus Jakarta Sans) for a more editorial feel
- Use `font-extrabold` with tighter letter-spacing (`tracking-tight`)
- Keep the gradient but refine it for a cleaner look
- Slightly increase the desktop size to `text-xl md:text-2xl` for better presence

### Technical Details

**Logo.tsx** -- update `sizeMap` and margins:
```ts
const sizeMap = {
  xs: { icon: 36, text: "text-lg" },
  sm: { icon: 42, text: "text-xl" },
  md: { icon: 160, text: "text-3xl" },
  lg: { icon: 220, text: "text-4xl" }
};
```
Compact margins changed from `"-ml-1 -mr-0.5"` to `"ml-0"` (no negative offset needed).

**Header.tsx** -- update the branding span:
```tsx
<span className="font-display font-extrabold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
  NewtonAI
</span>
```

These two edits will keep the logo fully inside the header and give the brand name a sharper, more designed feel.
