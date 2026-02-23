

# Fix Document Opening & Add Back-to-Class Button

## Issues Found

### 1. Document Not Opening as PDF
The material name passed via navigation state is the title (e.g., "Unit-II Zener diode") without a `.pdf` extension. In `Index.tsx`, the `handleUploadComplete` function checks `data.pdfName.toLowerCase().endsWith('.pdf')` to determine if it's a PDF. Since the title doesn't end with `.pdf`, the file renders as an **image** instead of a PDF -- showing a broken image icon.

**Fix:** When loading a class material, also check the URL itself for `.pdf` extension, not just the display name. Update the material loading logic to detect PDF from either the name OR the URL.

### 2. No Back Button to Class View
When a student opens a material from their class, the dashboard's back button says "New File" and just resets to the upload screen. There's no way to return to the class view.

**Fix:** Pass the class return route in the navigation state. When the dashboard detects it was opened from a class, show a "Back to Class" button that navigates back to the class view.

---

## Implementation

### Step 1: Pass class return info in navigation state

**Files:** `src/pages/student/StudentClassView.tsx`, `src/pages/teacher/ClassDetail.tsx`

Add `returnTo` to the navigation state so the dashboard knows where to go back:

```typescript
// Student view
navigate("/dashboard", { 
  state: { materialUrl: m.content_ref, materialName: m.title, returnTo: `/student/classes/${id}` } 
});

// Teacher view  
navigate("/dashboard", { 
  state: { materialUrl: m.content_ref, materialName: m.title, returnTo: `/teacher/classes/${id}` } 
});
```

### Step 2: Fix PDF detection in Index.tsx

**File:** `src/pages/Index.tsx`

Update the material loading `useEffect` to detect PDF from the URL when the name doesn't have a `.pdf` extension:

```typescript
if (state?.materialUrl) {
  materialConsumedRef.current = true;
  const name = state.materialName || "Class Material";
  // Detect PDF from URL if name doesn't have extension
  const pdfName = name.toLowerCase().endsWith('.pdf') ? name : 
    state.materialUrl.toLowerCase().includes('.pdf') ? name + '.pdf' : name;
  handleUploadComplete({ pdfUrl: state.materialUrl, pdfName });
  // ...
}
```

### Step 3: Add "Back to Class" button in dashboard header

**File:** `src/pages/Index.tsx`

- Store `returnTo` from navigation state
- When `returnTo` exists, change the back button from "New File" (reset) to "Back to Class" (navigate back)

```typescript
const [returnTo, setReturnTo] = useState<string | null>(null);

// In the material useEffect:
if (state?.returnTo) setReturnTo(state.returnTo);

// In the header:
<Button onClick={() => returnTo ? navigate(returnTo) : handleReset()}>
  <ArrowLeft />
  <span>{returnTo ? "Back to Class" : "New File"}</span>
</Button>
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Fix PDF detection from URL; add `returnTo` state; update back button |
| `src/pages/student/StudentClassView.tsx` | Pass `returnTo` in navigation state |
| `src/pages/teacher/ClassDetail.tsx` | Pass `returnTo` in navigation state |
