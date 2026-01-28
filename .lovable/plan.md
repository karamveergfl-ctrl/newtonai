
# Plan: Fix Adsterra Native Ads Not Displaying

## Problem Analysis

The ads are not showing because of how the Adsterra script works:

1. The Adsterra script (`invoke.js`) is hardcoded to look for a container with the **exact** ID `container-784f975abdd60c86610b3cf2654a25b5`
2. Our component is creating custom IDs like `container-784f975abdd60c86610b3cf2654a25b5-summarizer-input`
3. The script cannot find the custom container IDs, so no ads are rendered

## Solution

We need to restructure the component to work with Adsterra's requirements. There are two approaches:

**Option A (Recommended)**: Load the script globally once and let Adsterra handle ad placement through their standard container. Each instance still works but we use the standard container ID.

**Option B**: Use a single instance approach where only one ad loads per page, or reload the script each time with a delay.

I'll implement Option A with a refined approach that:
1. Uses the **exact container ID** that Adsterra expects
2. Loads the script only once globally (not per instance)
3. Adds a slight delay between instances to allow the script to initialize properly

## Implementation

### Update AdsterraNativeBanner.tsx

```text
src/components/AdsterraNativeBanner.tsx

Changes:
- Use the exact container ID that Adsterra expects (without instance suffix)
- Load the script globally once, not per component
- Each component instance creates the container and triggers script execution
- Add window-level tracking to prevent duplicate script loads
```

**New logic:**
1. Component mounts and creates a container with the standard Adsterra ID
2. Check if the global script is already loaded
3. If not loaded, append the script to document.head (not the container)
4. The script will find all containers with the matching ID and populate them
5. For multiple instances on the same page, we need to use Adsterra's refresh/multiple ad approach

**Alternative approach (simpler):**
Since Adsterra native ads typically only support one ad per page per script, we should:
1. Keep the component simple
2. Load script to document.head once
3. Use the standard container ID
4. For multiple placements, consider using different ad zones from Adsterra (different script/container pairs)

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/AdsterraNativeBanner.tsx` | Rewrite script loading logic to use global script and standard container ID |

## Technical Details

The updated component will:

```tsx
export function AdsterraNativeBanner({ className, instanceId = 'default' }: AdsterraNativeBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if script already exists globally
    const scriptId = 'adsterra-native-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl28588760.effectivegatecpm.com/784f975abdd60c86610b3cf2654a25b5/invoke.js';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className={cn("w-full my-6 md:my-8 px-4 sm:px-0 overflow-hidden", className)} ref={containerRef}>
      {/* Use the exact container ID Adsterra expects */}
      <div id="container-784f975abdd60c86610b3cf2654a25b5"></div>
    </div>
  );
}
```

**Note:** If Adsterra only populates the first container it finds, we may need to request multiple ad zones from Adsterra for multiple placements per page. This is a common limitation with native ad scripts.

## Expected Result

After this fix:
- The Adsterra script will load once globally
- The container will have the exact ID that Adsterra expects
- Ads should start displaying in the container

## Potential Limitation

If only one ad shows per page (due to Adsterra's script behavior), you may need to:
1. Contact Adsterra for multiple native ad zones
2. Use only one ad placement per page
3. Implement a rotation system

This fix addresses the immediate bug of ads not loading at all.
