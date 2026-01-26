
# Fix: Seamless Video Transition for Processing Overlay

## Problem

When the processing overlay appears, users see a visual "jump" between two different Newton poses:
1. **First:** Static poster image - Newton standing (beige/pink background)
2. **Then:** Video starts - Newton writing with pencil (gray background, desk)

This happens because `/newton-poster.webp` doesn't match the first frame of `/newton-processing.mp4`.

## Solution

Replace the current poster image with one that matches the **exact first frame** of the Newton processing video. This ensures:
- Zero visual jump when video starts playing
- Smooth, seamless transition from loading state to video playback
- Consistent visual experience throughout

## Technical Implementation

### Step 1: Extract First Frame from Video

We need to extract the first frame from `/newton-processing.mp4` and save it as the new poster image. This can be done by:

**Option A: Using FFmpeg (recommended)**
```bash
ffmpeg -i newton-processing.mp4 -vframes 1 -q:v 2 newton-poster.webp
```

**Option B: Canvas capture in browser**
Create a utility to capture the first frame:
```typescript
const video = document.createElement('video');
video.src = '/newton-processing.mp4';
video.currentTime = 0;
video.addEventListener('loadeddata', () => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  // Export as WebP/PNG
});
```

### Step 2: Replace `/public/newton-poster.webp`

Replace the existing poster file with the newly extracted first frame. No code changes required since the file path remains the same.

### Files to Modify

| File | Changes |
|------|---------|
| `public/newton-poster.webp` | **Replace** with first frame extracted from the video |

### No Code Changes Required

The current implementation already uses `/newton-poster.webp` correctly in both:
- `ProcessingOverlay.tsx` - As the loading fallback image (line 264) and video poster (line 288)
- `VideoPreloader.tsx` - As the video poster (line 42)

The issue is purely an **asset mismatch**, not a code issue.

## Alternative Approach (If Replacing Asset Isn't Possible)

If we cannot replace the asset file directly, we could:

1. **Create a new poster image** (e.g., `newton-poster-v2.webp`) from the video's first frame
2. **Update all references** in `ProcessingOverlay.tsx` and `VideoPreloader.tsx` to use the new file

## Expected Result

After the fix:
- Loading state shows Newton in the exact same pose as video start
- When video begins playing, there's no visible "jump"
- Users see a smooth, continuous animation throughout processing
