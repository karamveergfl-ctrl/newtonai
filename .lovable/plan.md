

# Improve Newton Chat with New Character Image

## Overview

Enhance the Newton AI assistant visuals by:
1. **Chat Avatar**: Use the new Newton character image with circular crop for all chat components
2. **New Logo**: Create a version with rounded square corners and "NewtonAI" branding on the paper sheet

## Implementation Details

### Step 1: Add New Character Assets

| Asset | Description | Destination |
|-------|-------------|-------------|
| `newton-chat-avatar.png` | Circular-cropped version for chat | `src/assets/newton-chat-avatar.png` |
| `newton-logo.png` | Rounded square version with "NewtonAI" on paper | `src/assets/newton-logo.png` |

The uploaded image will be copied to `src/assets/` and used directly. For the logo version with "NewtonAI" text on the paper, we'll use AI image generation to create a modified version.

### Step 2: Update Newton Chat Components

**Files to modify:**

| File | Changes |
|------|---------|
| `src/components/newton-assistant/NewtonChatPanel.tsx` | Update header avatar to use new circular image with proper styling |
| `src/components/newton-assistant/NewtonTriggerButton.tsx` | Update floating button to use new circular character image |
| `src/components/newton-assistant/NewtonMessageBubble.tsx` | Update assistant message avatar to use new circular image |
| `src/components/GlobalNewtonAssistant.tsx` | Remove unused import of old character image |

**Avatar Styling (Circular Crop):**
```tsx
<div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20">
  <img
    src={newtonChatAvatar}
    alt="Newton"
    className="w-full h-full object-cover"
  />
</div>
```

### Step 3: Update Logo Component

**File:** `src/components/Logo.tsx`

| Change | Description |
|--------|-------------|
| Import new logo image | `import newtonLogo from "@/assets/newton-logo.png"` |
| Update container styling | Change from `rounded-full` to `rounded-xl` for rounded square edges |
| Keep glowing effect | Adjust blur styling to match rounded square shape |

**New Logo Styling:**
```tsx
<div className="relative rounded-xl overflow-hidden shadow-md border border-white/10 w-full h-full">
  <img
    src={newtonLogo}
    alt="NewtonAI Logo"
    className="w-full h-full object-cover"
  />
</div>
```

### Step 4: Create Logo Image with "NewtonAI" Text

Use AI image generation to create a version of the Newton character with "NewtonAI" written on the paper sheet he's writing on. This provides brand consistency across the application.

**Prompt for generation:**
- Same Newton character at desk with pencil
- "NewtonAI" text visible on the paper sheet
- Rounded square aspect ratio suitable for logo use

## Visual Summary

```
+----------------------------------+
|  NEWTON CHAT IMPROVEMENTS        |
+----------------------------------+
|                                  |
|  Chat Header:                    |
|  [●] Newton AI                   |
|   ^-- Circular crop avatar       |
|                                  |
|  Trigger Button:                 |
|       +-----+                    |
|       | ●●● | <-- Circular crop  |
|       +-----+     with glow      |
|                                  |
|  Message Bubbles:                |
|  [●] Hi, I'm Newton!             |
|   ^-- Circular avatar            |
|                                  |
+----------------------------------+
|  LOGO COMPONENT                  |
+----------------------------------+
|                                  |
|  +-------+                       |
|  |       |  NewtonAI             |
|  | 📝    |  ^-- Gradient text    |
|  +-------+                       |
|   ^-- Rounded square             |
|       with "NewtonAI" on paper   |
|                                  |
+----------------------------------+
```

## Files Modified

1. `src/assets/newton-chat-avatar.png` - New circular avatar image (copied from upload)
2. `src/assets/newton-logo.png` - New logo with "NewtonAI" text on paper (AI generated)
3. `src/components/newton-assistant/NewtonChatPanel.tsx` - Updated avatar styling
4. `src/components/newton-assistant/NewtonTriggerButton.tsx` - Updated button image
5. `src/components/newton-assistant/NewtonMessageBubble.tsx` - Updated message avatar
6. `src/components/GlobalNewtonAssistant.tsx` - Cleaned up unused imports
7. `src/components/Logo.tsx` - Updated to use new rounded square logo

## Expected Result

- **Chat Widget**: Newton character appears in clean circular crops throughout the chat interface
- **Floating Button**: Prominent Newton avatar with breathing glow effect
- **Logo**: Professional rounded square logo with "NewtonAI" branding visible on the paper sheet
- **Consistent Branding**: Same character design used across all Newton-related UI elements

