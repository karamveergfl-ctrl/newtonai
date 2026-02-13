

## Fix Logo: Zoom Out, Reduce Margins

### Issues (from screenshots)
1. Logo is clipped on the left side in the sidebar -- the crop is too aggressive
2. Too much space between the wooden frame and "NewtonAI" text
3. Too much space between the logo and the top edge of the sidebar

### Changes

**1. `src/components/Logo.tsx`**
- Dial back the crop from `w-[160%] h-[160%] -m-[30%]` to approximately `w-[140%] h-[140%] -m-[20%]` so the full wooden frame is visible without clipping
- Reduce the sidebar sizes: sm from 120px to about 56px so it fits properly in the sidebar without overflow
- Keep `gap-0` between logo and text

**2. `src/components/AppSidebar.tsx`**
- Reduce SidebarHeader top padding further (use `px-1 pt-0 pb-0` or similar) to push the logo closer to the top edge of the sidebar

### Result
- Full wooden frame visible, no clipping on the left
- "NewtonAI" text tight against the logo
- Logo sits closer to the top of the sidebar

