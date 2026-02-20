

## Make Tool Badges Navigate to Their Pages

### Current Behavior
The tool badges (Notes, Quiz, Flashcards, PDF, Mind Map, Summary, Videos, Podcast) around the phone mockup are buttons that only change the selected tool visually. They don't navigate anywhere.

### Fix
**File:** `src/components/FloatingToolsShowcase.tsx`

- Wrap each `ToolBadge` button with a `Link` from react-router-dom, using the tool's existing `route` property
- Change the `<button>` element to a `<Link>` element with `to={tool.route}`
- Keep the visual selection behavior via `onClick` but add navigation
- The "Podcast" route is currently `/tools/podcast` but the correct route is `/tools/ai-podcast` -- fix this mapping

### Technical Details

| File | Change |
|------|--------|
| `src/components/FloatingToolsShowcase.tsx` | Change `ToolBadge` from `<button>` to `<Link to={tool.route}>` so clicking navigates to the tool page. Fix Podcast route from `/tools/podcast` to `/tools/ai-podcast`. |

