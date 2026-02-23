

# Fix Class Material PDF Opening & Back Navigation

## Problem

1. **PDF not rendering**: When opening a class material, the system determines if a file is a PDF by checking if the filename ends with `.pdf`. Since the material title ("Unit-II Zener diode") doesn't have that extension, the file renders as an image (broken icon) instead of as a PDF viewer.

2. **Video materials missing return path**: The `returnTo` state is only saved for document materials, not for video materials opened from a class.

## Root Cause

The class views already know the `material_type` is `"pdf"`, but this information is not passed through the navigation state. Instead, `Index.tsx` tries to guess from the filename -- which fails when the title is a human-readable name without an extension.

## Solution

### Step 1: Pass `isPdf` flag from class views

Instead of relying on filename heuristics, pass an explicit `isPdf: true` flag in the navigation state when the material type is known to be a PDF or document.

**Files:** `src/pages/student/StudentClassView.tsx`, `src/pages/teacher/ClassDetail.tsx`

```typescript
navigate("/dashboard", { 
  state: { 
    materialUrl: m.content_ref, 
    materialName: m.title, 
    returnTo: `/student/classes/${id}`,
    isPdf: true  // material_type is already "pdf"
  } 
});
```

### Step 2: Use the `isPdf` flag in Index.tsx material loader

Update the material loading logic to use the explicit flag, falling back to URL/name detection.

**File:** `src/pages/Index.tsx`

```typescript
if (state?.materialUrl) {
  materialConsumedRef.current = true;
  const name = state.materialName || "Class Material";
  // Use explicit flag, or detect from name/URL
  const isPdf = state.isPdf || name.toLowerCase().endsWith('.pdf') || 
    state.materialUrl.toLowerCase().includes('.pdf');
  const pdfName = isPdf && !name.toLowerCase().endsWith('.pdf') ? name + '.pdf' : name;
  handleUploadComplete({ pdfUrl: state.materialUrl, pdfName });
  if (state.returnTo) setReturnTo(state.returnTo);
  window.history.replaceState({}, document.title);
}
```

### Step 3: Save `returnTo` for video materials too

The video material path currently doesn't save the `returnTo`, so clicking back after opening a YouTube video from a class doesn't work.

**File:** `src/pages/Index.tsx`

```typescript
} else if (state?.materialVideoUrl) {
  materialConsumedRef.current = true;
  // ... existing YouTube logic ...
  if (state.returnTo) setReturnTo(state.returnTo);  // ADD THIS
  window.history.replaceState({}, document.title);
}
```

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Accept `isPdf` flag in state; save `returnTo` for video materials |
| `src/pages/student/StudentClassView.tsx` | Pass `isPdf: true` in navigation state |
| `src/pages/teacher/ClassDetail.tsx` | Pass `isPdf: true` in navigation state |

## Expected Result

- Class PDF materials open in the full PDF viewer (with page navigation, zoom, etc.) exactly like directly uploaded PDFs
- "Back to Class" button appears and navigates back to the class view for both PDF and video materials

