
# Fix Logo & Newton Chat Improvements

## Issues to Address

Based on the user's screenshots and requirements:
1. **Logo zoom in** - Make Newton character appear bigger inside the logo container
2. **Remove black border** - Eliminate the visible dark border/outline from the logo
3. **Apply same style to sidebar** - Ensure the sidebar logo matches the updated style
4. **Improve Newton Chat logo** - Enhance the floating trigger button avatar

## Implementation Details

### 1. Update Logo Component (`src/components/Logo.tsx`)

**Changes:**
- Add `scale-125` transform to zoom in on the Newton character image
- Remove any shadow that might be causing the dark border appearance
- Keep the rounded-xl container but remove shadow-md which creates the border effect
- Maintain the glowing gradient effect

```tsx
{/* Logo container */}
<div className="relative rounded-xl overflow-hidden w-full h-full">
  <img
    src={newtonLogo}
    alt="NewtonAI Logo"
    className="w-full h-full object-cover scale-125"
  />
</div>
```

### 2. Sidebar Already Uses Logo Component

The `AppSidebar.tsx` already imports and uses the `Logo` component (line 128):
```tsx
{!isCollapsed && <Logo size="sm" showText={true} />}
```

Changes to `Logo.tsx` will automatically apply to the sidebar.

### 3. Improve Newton Chat Trigger Button (`NewtonTriggerButton.tsx`)

**Current Issues:**
- Avatar appears small inside the button
- May have border/outline visible

**Improvements:**
- Increase avatar size from `w-10 h-10` to `w-11 h-11` for better visibility
- Remove any visible borders
- Add subtle scale transform to make Newton appear more prominent
- Improve the overall visual quality

```tsx
<div className="w-11 h-11 rounded-full overflow-hidden">
  <img
    src={newtonChatAvatar}
    alt="Newton AI"
    className="w-full h-full object-cover scale-110"
  />
</div>
```

### 4. Improve Newton Chat Panel Header Avatar (`NewtonChatPanel.tsx`)

**Changes:**
- Remove the border styling that may be causing outline issues
- Apply scale transform to zoom in on Newton
- Enhance shadow for depth without borders

```tsx
<div className="w-9 h-9 rounded-full overflow-hidden shadow-sm">
  <img
    src={newtonChatAvatar}
    alt="Newton"
    className="w-full h-full object-cover scale-110"
  />
</div>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/Logo.tsx` | Remove shadow-md, add scale-125 to image for zoom effect |
| `src/components/newton-assistant/NewtonTriggerButton.tsx` | Increase avatar size, add scale transform |
| `src/components/newton-assistant/NewtonChatPanel.tsx` | Remove border from header avatar, add scale |
| `src/components/newton-assistant/NewtonMessageBubble.tsx` | Remove border from message avatars, add scale |

## Visual Summary

```
BEFORE                          AFTER
+-------+                      +-------+
| [···] | shadow border        |       | no border
| [img] | small Newton         | [IMG] | zoomed-in Newton
+-------+                      +-------+

Logo: scale(1.0) + shadow    → scale(1.25) + no shadow
Chat Avatar: 10×10 + border  → 11×11 + scale(1.1) + no border
```

## Expected Results

- **Logo**: Newton character appears larger/zoomed-in, no black border/outline visible
- **Sidebar**: Same improved logo automatically applied
- **Newton Chat Button**: Larger, cleaner avatar without border
- **Chat Panel**: Consistent borderless avatars throughout
