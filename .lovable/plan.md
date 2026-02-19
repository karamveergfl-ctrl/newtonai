

## Fix Logo: Crop to Wooden Badge Only

The current `newton-logo-clean.png` still has extra background/padding around the circular wooden badge. The goal is to replace it with a tightly cropped version showing only the circular Newton character badge with the wooden frame, matching the second reference image.

### Plan

1. **Generate a new clean logo image** using AI image editing -- take the current logo and instruct it to crop tightly to just the circular wooden badge with the "NewtonAI" banner, removing all surrounding background/padding.

2. **Save the result** as `src/assets/newton-logo-clean.png`, replacing the current file.

3. **No component changes needed** -- `Logo.tsx` already imports from `newton-logo-clean.png`, so it will pick up the new image automatically.

### Technical Details

- The `imagegen--edit_image` tool will be used with the second reference image (`user-uploads://image-358.png`) as the source, with instructions to output it cleanly with transparent background
- If the AI editor alters the art style, we will instead copy the user's uploaded reference image directly as the logo since it already looks correct
- The Logo component's `object-contain` class will handle proper scaling at all sizes (xs/sm/md/lg)

