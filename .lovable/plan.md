

## Replace Logo With New Newton Character Image

### What Changes
Replace the current small icon-style logo with the uploaded Newton character image across the entire app, and remove the glowing white border effect.

### Technical Details

**1. Copy the new logo asset**
- Copy `user-uploads://image-332.png` to `src/assets/newton-logo.png` (overwriting the existing file)

**2. Update `src/components/Logo.tsx`**
- Remove the glowing ring/border (`blur-md opacity-70` gradient div)
- Remove the `rounded-xl overflow-hidden` container that clips the image
- Remove the `scale-150` on the image (the new logo already shows the full character)
- Keep the image rendering clean with just `object-contain` instead of `object-cover`
- Adjust size map to be slightly larger since this logo has more detail:
  - sm: 36px, md: 52px, lg: 72px
- Keep the `showText` prop but default it to `false` since the logo image itself contains "NewtonAI" text
- Retain the hover scale animation

**3. No other files need changes**
All other files (`Header.tsx`, `Footer.tsx`, `Auth.tsx`, `AppSidebar.tsx`, etc.) import and use the `Logo` component, so they will automatically pick up the new design.

### Result
- Clean Newton character logo with no white border/glow
- Consistent across all pages (Header, Footer, Sidebar, Auth, Onboarding, etc.)
- The logo image itself contains the "NewtonAI" text, so the separate text span becomes optional

