

## Remove White Frame from Logo

The current logo (`newton-logo-clean.png`) has a white rectangular frame/background surrounding the circular wooden badge. The goal is to regenerate the logo showing only the circular Newton character badge with its wooden frame on a transparent background -- no white rectangle.

### What will change

1. **Regenerate the logo image** using AI image editing to remove the white rectangular frame, keeping only the circular wooden badge with the Newton character and "NewtonAI" banner on a transparent background.

2. **Save as** `src/assets/newton-logo-clean.png`, replacing the current file.

3. **No code changes needed** -- `Logo.tsx` already imports this file and uses `object-contain`, so it will display correctly at all sizes once the image is updated.

### Technical Details

- The `imagegen--edit_image` tool will be used with the current logo as source, instructing it to remove the white rectangular background and keep only the circular badge with transparent surroundings
- If the AI alters the art style, we will try alternative prompts focusing on background removal
- The circular shape will naturally fit the existing `aspect-square` container in the Logo component

