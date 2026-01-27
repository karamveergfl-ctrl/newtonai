
# Unify Study Tools to Match Search Bar Video Tool Behavior

## Problem Analysis

You have multiple tools across different contexts that need to work consistently like the search bar video tool:

| Tool Location | Current Behavior | Issue |
|---------------|------------------|-------|
| Text Selection (Image 1) | Direct API calls | No Newton animation, no settings dialog |
| PDF Top Toolbar (Image 2) | Instant UI pattern | Different UX from video tools |
| Video Panel (Image 4) | Has Newton animation | ✓ Reference implementation |
| Search Bar (Image 5) | Has Newton animation | ✓ Target behavior |

The search bar video tool uses:
- Newton processing animation with thinking → writing → completed phases
- `VideoGenerationSettingsDialog` for customization
- Proper loading states with `ProcessingOverlay`

## Solution

Update the Text Selection Toolbar and PDF Study Tools to use the same Newton animation workflow as the video tools.

## Implementation

### 1. Update TextSelectionToolbar Props

**File: `src/components/TextSelectionToolbar.tsx`**

Add settings dialog integration - the toolbar should open settings dialog before generation (like video cards do):

```tsx
// Add new imports
import { UniversalStudySettingsDialog, UniversalStudySettings } from "./UniversalStudySettingsDialog";
import { useState } from "react";

// Add state for pending tool and settings dialog
const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
const [pendingToolType, setPendingToolType] = useState<string | null>(null);

// Modify button handlers to open settings first
const handleToolClick = (toolType: string) => {
  setPendingToolType(toolType);
  setSettingsDialogOpen(true);
};

// Add settings dialog component at the end
```

### 2. Update Index.tsx Text Selection Handlers

**File: `src/pages/Index.tsx`**

The text selection handlers (`handleGenerateQuizFromText`, etc.) need to use the Newton processing animation like video handlers do:

**Current Pattern (lines 1523-1581):**
```tsx
const handleGenerateFlashcardsFromText = async (selectedText: string) => {
  // INSTANT UI: Show flashcards screen immediately with loading
  setFlashcards([]);
  setFlashcardTitle("Flashcards from Selected Text");
  setShowFlashcardsScreen(true);
  setIsGeneratingFlashcards(true);
  // ... API call
};
```

**Target Pattern (match video handlers, lines 624-685):**
```tsx
const handleGenerateFlashcardsFromText = async (selectedText: string, settings?: GenerationSettings) => {
  // Check credits
  const allowed = await trySpendCredits("flashcards");
  if (!allowed) return;
  
  // Start Newton animation
  setVideoProcessingMessage("Generating flashcards...");
  startVideoThinking();
  setActiveGenerating("flashcards");
  setIsGeneratingFlashcards(true);
  
  try {
    // API call
    startVideoWriting();
    const response = await fetch(...);
    const data = await response.json();
    
    // Store result and trigger completion animation
    setPendingVideoResult({ type: 'flashcards', data, title: "Selected Text" });
    completeVideoProcessing();
  } catch (error) {
    resetVideoProcessing();
    // ... error handling
  }
};
```

### 3. Files to Modify

| File | Changes |
|------|---------|
| `src/components/TextSelectionToolbar.tsx` | Add settings dialog, change handlers to open settings first |
| `src/components/MobileTextSelectionDrawer.tsx` | Add settings dialog for mobile |
| `src/pages/Index.tsx` | Update `handleGenerate*FromText` functions to use Newton animation pattern |
| `src/components/StudyToolsBar.tsx` | Optionally add Newton animation for PDF-based tools |

### 4. Detailed Changes

#### A. TextSelectionToolbar.tsx - Add Settings Dialog

```tsx
import { useState } from "react";
import { UniversalStudySettingsDialog } from "./UniversalStudySettingsDialog";

interface TextSelectionToolbarProps {
  // ... existing props
  // Add settings callback variant
  onGenerateQuizWithSettings?: (settings: any) => void;
  onGenerateFlashcardsWithSettings?: (settings: any) => void;
  onGenerateSummaryWithSettings?: (settings: any) => void;
  onGenerateMindMapWithSettings?: (settings: any) => void;
}

export const TextSelectionToolbar = ({
  // ... existing props
}: TextSelectionToolbarProps) => {
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [pendingToolType, setPendingToolType] = useState<"quiz" | "flashcards" | "summary" | "mindmap" | null>(null);
  
  const handleToolClick = (toolType: "quiz" | "flashcards" | "summary" | "mindmap") => {
    setPendingToolType(toolType);
    setSettingsDialogOpen(true);
  };
  
  const handleGenerateWithSettings = (settings: any) => {
    if (!pendingToolType) return;
    switch (pendingToolType) {
      case "quiz":
        onGenerateQuiz();
        break;
      // ... other cases
    }
    setPendingToolType(null);
  };
  
  return (
    <>
      {/* Existing card UI with buttons calling handleToolClick instead */}
      
      {/* Add Settings Dialog */}
      {pendingToolType && (
        <UniversalStudySettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          toolType={pendingToolType}
          contentSource="text"
          onGenerate={handleGenerateWithSettings}
        />
      )}
    </>
  );
};
```

#### B. Index.tsx - Update Text Handlers to Use Newton Animation

Update all four handlers (`handleGenerateQuizFromText`, `handleGenerateFlashcardsFromText`, `handleGenerateSummaryFromText`, `handleGenerateMindMapFromText`) to follow this pattern:

```tsx
const handleGenerateFlashcardsFromText = async (selectedText: string, settings?: GenerationSettings) => {
  if (!selectedText || selectedText.length < 20) {
    toast({ title: "Text too short", ... });
    return;
  }
  
  const allowed = await trySpendCredits("flashcards");
  if (!allowed) return;
  
  // Newton animation start
  setVideoProcessingMessage("Generating flashcards from selected text...");
  startVideoThinking();
  setActiveGenerating("flashcards");
  setIsGeneratingFlashcards(true);
  
  try {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession?.access_token) throw new Error("Not authenticated");
    
    startVideoWriting();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authSession.access_token}`
      },
      body: JSON.stringify({
        type: "text",
        content: selectedText,
        title: "Selected Text",
        settings
      })
    });
    
    if (!response.ok) throw new Error("Failed to generate flashcards");
    const data = await response.json();
    
    // Store result and complete animation
    setPendingVideoResult({ type: 'flashcards', data, title: "Selected Text Flashcards" });
    completeVideoProcessing();
  } catch (error) {
    console.error("Error:", error);
    resetVideoProcessing();
    setIsGeneratingFlashcards(false);
    setActiveGenerating(null);
    toast({ title: "Error", description: "Failed to generate flashcards", variant: "destructive" });
  }
};
```

## Benefits

1. **Consistent UX** - All tools (text selection, PDF toolbar, video cards, search bar) use the same Newton animation workflow
2. **Settings Dialogs** - Users can customize generation before it starts (count, difficulty, etc.)
3. **Visual Feedback** - Newton character provides engaging feedback during processing
4. **Unified Codebase** - Easier to maintain with one pattern for all generation tools

## Technical Notes

- The Newton animation uses `useProcessingState` hook with phases: `idle → thinking → writing → completed → idle`
- The `ProcessingOverlay` component displays the Newton animation
- `pendingVideoResult` stores results until animation completes, then displays the content
- This pattern prevents the jarring "instant UI" behavior and provides a polished experience
