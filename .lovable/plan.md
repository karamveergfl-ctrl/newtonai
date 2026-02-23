

# Open Class Materials in Dashboard Viewer

## Problem
When a student clicks on a class material (uploaded PDF/document), it currently opens in a new browser tab via an external link. Instead, it should open inside the dashboard's document viewer (the same one used by the Upload Document zone), giving students access to all study tools like Screenshot to Solve, Topic-Based Video Search, etc.

## Solution

### 1. Update Student Material Click Behavior (`src/pages/student/StudentClassView.tsx`)

Instead of rendering an `<a href>` external link button, clicking a material card will navigate to `/dashboard` with the material's URL and name passed via React Router's `location.state`:

```typescript
navigate("/dashboard", { 
  state: { materialUrl: m.content_ref, materialName: m.title } 
});
```

- Only navigate for document/PDF types that have a `content_ref`
- Keep external link icon as a secondary action (right-click / long-press to open in new tab)
- The entire card becomes clickable

### 2. Update Dashboard to Accept Incoming Material (`src/pages/Index.tsx`)

- Import `useLocation` from `react-router-dom`
- On mount, check `location.state` for `materialUrl` and `materialName`
- If present, call `handleUploadComplete` with those values to load the document into the viewer automatically
- Clear the state after consuming it so refreshing the page doesn't re-trigger

### Technical Details

**Files Modified:**

| File | Change |
|------|--------|
| `src/pages/student/StudentClassView.tsx` | Replace external link button with `navigate("/dashboard", { state })` on material card click |
| `src/pages/Index.tsx` | Add `useLocation`, read `location.state.materialUrl/materialName` on mount, auto-load document |

**Flow:**
```text
Student clicks material card
  -> navigate("/dashboard", { state: { materialUrl, materialName } })
  -> Index.tsx reads location.state
  -> Calls handleUploadComplete({ pdfUrl: materialUrl, pdfName: materialName })
  -> Document opens in the viewer with all study tools available
```

No database changes needed. No new files needed.
