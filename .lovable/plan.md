

## Crop Logo Tighter: Show Only the Wooden Frame

### Problem
The current 130% scale with -15% margin still leaves some transparent padding around the wooden frame badge. The logo needs a more aggressive crop to show only the wooden frame.

### Changes

**`src/components/Logo.tsx`**
- Increase the image scale from `w-[130%] h-[130%]` to approximately `w-[160%] h-[160%]`
- Increase the negative margin from `-m-[15%]` to `-m-[30%]` to match the larger scale and center the cropped area
- Keep `overflow-hidden` on the container to clip everything outside the wooden frame
- The wooden frame badge will fill the container with no visible transparent border

### Result
- Only the wooden frame badge is visible -- no transparent padding
- Logo appears larger and more prominent in the same container size
- "NewtonAI" text sits right next to the wooden frame edge

