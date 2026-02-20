

## Restructure Mobile Bottom Nav: Camera-Centric Layout

### What Changes

The bottom navigation bar will be reorganized to put the **Snap (Camera)** button in the center position with an elevated design, and the **Newton** button will move to where Snap currently is. Tapping Snap will directly open the device camera to capture a photo, then navigate to the Homework Help page with the captured image ready for processing.

### Layout Change

```text
Current:  Home | Snap | [Newton] | Tools | Profile
New:      Home | Newton | [Snap/Camera] | Tools | Profile
```

The center Camera button will have the elevated circular design (currently used by Newton), making it the primary action.

### How the Camera Works

When the user taps the center Camera button:
1. A hidden file input with `accept="image/*" capture="environment"` is triggered
2. This opens the device camera directly on mobile phones
3. After capturing/selecting a photo, the user is navigated to `/tools/homework-help` with the image passed via React Router state
4. The Homework Help page picks up the image from navigation state and processes it automatically

### File Changes

| File | Change |
|------|--------|
| `src/components/MobileBottomNav.tsx` | Swap Snap and Newton positions; add hidden file input for camera; Snap gets elevated center style, Newton gets regular tab style; on photo capture, navigate to homework help with image state |
| `src/pages/tools/HomeworkHelp.tsx` | Read image from `location.state` on mount; if present, auto-trigger the solve flow with the captured image |

### Technical Details

**MobileBottomNav.tsx:**
- Reorder NAV_ITEMS: Home, Newton, Snap (center), Tools, Profile
- Change Newton from `action: "newton"` to a regular elevated-style center button that opens the assistant
- Change Snap to `action: "camera"` with the elevated circular center design (gradient background, shadow, larger size)
- Add a hidden `<input type="file" accept="image/*" capture="environment">` ref
- On file select: convert to base64, navigate to `/tools/homework-help` with `state: { capturedImage: { imageBase64, mimeType } }`
- Newton becomes a regular nav item that triggers the assistant drawer (same functionality, just regular tab style)

**HomeworkHelp.tsx:**
- Use `useLocation()` to check for `location.state?.capturedImage`
- On mount, if `capturedImage` exists, set it as `capturedScreenshot` to trigger the `InlineSolutionPanel` flow automatically
- Clear the state after consuming it to prevent re-triggering on navigation
