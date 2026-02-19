

## Regenerate Logo: Circular Badge Only, No White Frame

The current `newton-logo-clean.png` still has a white rectangular background surrounding the circular wooden badge. The logo needs to be regenerated as just the circular Newton character badge with its wooden frame on a fully transparent background.

### What will change

1. **Regenerate the logo image** using AI image generation -- create the NewtonAI circular wooden badge logo with the Newton apple character and "NewtonAI" banner, on a transparent background with no white or colored rectangular frame around it.

2. **Save as** `src/assets/newton-logo-clean.png`, replacing the current file.

3. **Update Logo component** -- add `rounded-full` to the container so the circular logo displays cleanly at all sizes, and remove the negative margins that were compensating for the old rectangular frame.

### Technical Details

- Use `imagegen--edit_image` with the current logo as source, instructing: "Remove the white rectangular background completely. Keep only the circular wooden badge with the Newton apple character and NewtonAI banner. Output on a fully transparent background, tightly cropped to the circle."
- If the result still has a frame, will attempt a second pass with a more explicit prompt
- The Logo component container will get `rounded-full` class to match the circular shape
- Negative margins will be reduced since the transparent circular image won't need as much compensation

