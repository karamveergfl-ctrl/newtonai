

## Fix Logo Spacing: Remove Invisible Padding Around the Wooden Frame

### Problem
The logo image has invisible transparent space (padding) around the wooden frame, which creates an unwanted gap between the logo and the "NewtonAI" text. The wooden frame itself should stay -- we just need to crop out the empty space surrounding it.

### Solution
Use CSS to visually crop the transparent area around the logo so only the wooden frame badge is visible, bringing the text closer.

### Changes

**1. `src/components/Logo.tsx`**
- Add `overflow-hidden` to the motion container
- Apply a negative margin on the logo image (e.g., `m-[-15%]` or similar) combined with scaling (`scale-[1.15]`) to visually crop the transparent padding around the wooden frame
- Alternatively, use `object-cover` with a slightly larger image scale so the transparent edges get clipped
- Reduce `gap-0.5` to `gap-0` or even use a small negative margin on the text to pull it closer to the logo
- Fine-tune the exact crop percentage to match the image's transparent border size

**2. No asset changes needed**
The logo image stays the same -- we're just using CSS to hide the invisible transparent area around the wooden frame.

### Result
- Wooden frame stays intact and visible
- Transparent padding around the frame is cropped away
- "NewtonAI" text sits much closer to the logo
- Clean, tight layout everywhere the logo appears

