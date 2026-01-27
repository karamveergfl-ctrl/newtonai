
# Fix Video Text Selection Tools Not Working

## Problem Summary
When users select text in the video/image viewer and click tools (Quiz, Flashcards, Notes, Map), nothing happens. The tools appear to be non-functional.

## Root Cause Analysis
The issue is a **closure/stale state bug** in how selected text is passed to generation callbacks:

1. In `ImageViewer.tsx` and `PDFReader.tsx`, callbacks are defined as:
   ```javascript
   onGenerateQuiz={(settings) => onGenerateQuizFromText?.(selectedText, settings)}
   ```

2. The `selectedText` used here captures the component's state at render time

3. When the user clicks a tool button:
   - `TextSelectionToolbar` correctly captures the text in `capturedTextRef.current`
   - Opens the `UniversalStudySettingsDialog`
   - When user confirms settings, `handleGenerateWithSettings` calls `onGenerateQuiz(settings)`
   - But `onGenerateQuiz` still uses the stale `selectedText` from ImageViewer's closure
   - By this point, browser selection events or re-renders may have cleared `selectedText`

4. Result: The generation function receives empty or stale text

## Solution
Change the callback interface to pass the captured text explicitly from the toolbar component.

### Files to Modify

**1. `src/components/TextSelectionToolbar.tsx`**
- Update interface to make callbacks accept `(text: string, settings?: UniversalGenerationSettings)`
- In `handleGenerateWithSettings`, pass `capturedTextRef.current` to the callbacks
- Add type safety to ensure captured text is used

**2. `src/components/MobileTextSelectionDrawer.tsx`**
- Same changes as TextSelectionToolbar
- Pass captured text explicitly to callbacks

**3. `src/components/ImageViewer.tsx`**
- Update callback signatures to receive text parameter
- Change from:
  ```javascript
  onGenerateQuiz={(settings) => onGenerateQuizFromText?.(selectedText, settings)}
  ```
  To:
  ```javascript
  onGenerateQuiz={(text, settings) => onGenerateQuizFromText?.(text, settings)}
  ```

**4. `src/components/PDFReader.tsx`**
- Same changes as ImageViewer

## Technical Details

### New Callback Interface
```typescript
interface TextSelectionToolbarProps {
  selectedText: string;
  onDismiss: () => void;
  onSearchVideos: () => void;
  // Updated: now receives text as first parameter
  onGenerateQuiz: (text: string, settings?: UniversalGenerationSettings) => void;
  onGenerateFlashcards: (text: string, settings?: UniversalGenerationSettings) => void;
  onGenerateSummary: (text: string, settings?: UniversalGenerationSettings) => void;
  onGenerateMindMap: (text: string, settings?: UniversalGenerationSettings) => void;
  // ... loading states
}
```

### Updated Handler Logic
```typescript
const handleGenerateWithSettings = useCallback((settings: UniversalGenerationSettings) => {
  if (!pendingToolType) return;
  
  // Use the captured text from when the tool was clicked
  const textToUse = capturedTextRef.current;
  
  if (!textToUse) {
    console.error("No captured text available");
    return;
  }
  
  switch (pendingToolType) {
    case "quiz":
      onGenerateQuiz(textToUse, settings);  // Pass text explicitly
      break;
    // ... other cases
  }
  
  setPendingToolType(null);
  capturedTextRef.current = "";
  onDismiss();
}, [pendingToolType, onGenerateQuiz, onGenerateFlashcards, onGenerateSummary, onGenerateMindMap, onDismiss]);
```

### Updated Usage in ImageViewer/PDFReader
```typescript
<TextSelectionToolbar
  selectedText={selectedText}
  onDismiss={handleDismiss}
  onSearchVideos={handleSearch}
  onGenerateQuiz={(text, settings) => onGenerateQuizFromText?.(text, settings)}
  onGenerateFlashcards={(text, settings) => onGenerateFlashcardsFromText?.(text, settings)}
  onGenerateSummary={(text, settings) => onGenerateSummaryFromText?.(text, settings)}
  onGenerateMindMap={(text, settings) => onGenerateMindMapFromText?.(text, settings)}
  // ... loading states
/>
```

## Expected Outcome
After this fix:
1. User selects text in video/image viewer
2. Toolbar appears with selected text preview
3. User clicks Quiz/Flashcards/Notes/Map button
4. Settings dialog opens
5. User confirms settings
6. Text is passed explicitly from captured ref to generation function
7. Newton animation starts and tool generates correctly

## Files Changed Summary
| File | Change |
|------|--------|
| `TextSelectionToolbar.tsx` | Update interface, pass captured text to callbacks |
| `MobileTextSelectionDrawer.tsx` | Same updates for mobile |
| `ImageViewer.tsx` | Update callback signatures to receive text |
| `PDFReader.tsx` | Update callback signatures to receive text |
