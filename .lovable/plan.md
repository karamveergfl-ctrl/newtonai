Two targeted fixes based on the reported problems and the screenshot you shared (where `\cdot m` rendered as red `\cdotm` — a LaTeX unit-spacing bug).

## 1. Fix writing / formatting mistakes across all tools

Root cause: the prompts tell the model to use LaTeX but don't enforce unit spacing, escaping, or a proofreading pass. So the model outputs things like `\cdotm`, `kN\cdotm`, unclosed `$`, or stray markdown mixed with math — which KaTeX renders in red.

Changes:
- Update the system prompt in every generation edge function (`analyze-text`, `solve-problem`, `generate-quiz`, `generate-flashcards`, `generate-lecture-notes`, `generate-summary`, `generate-mindmap`, `newton-chat`) with a strict "LaTeX hygiene" block:
  - Units must be wrapped as `\,\text{unit}` (e.g. `2.5\,\text{m}`, `138.46\,\text{kN}`), never bare `m` or `kN` glued to `\cdot`.
  - Every LaTeX control word (`\cdot`, `\times`, `\sum`, etc.) must be followed by a space or `{}` before any letter.
  - Every `$` / `$$` must be balanced; no markdown (`**`, `*`, `_`) inside math.
  - Spell-check + grammar pass required before returning; no half-words, no duplicated punctuation.
- Add a lightweight post-processing sanitizer in `src/lib/utils.ts` (or a new `src/lib/latexSanitize.ts`) that runs on any AI text before it's rendered:
  - Regex-fix `\cdot([a-zA-Z])` → `\cdot\,\text{$1}`
  - Regex-fix `\times([a-zA-Z])` → `\times\,\text{$1}`
  - Regex-fix `([0-9])\s*(kN|m|s|kg|N|J|W|Hz|mol|cm|mm|km)\b` inside math delimiters → `$1\,\text{$2}`
  - Trim orphan single `$` at line end.
- Wire the sanitizer into `MarkdownRenderer` (single choke-point) so every tool benefits without touching each page.

## 2. Improve Homework Help image / figure accuracy

Root cause: `analyze-text` sends images to `google/gemini-2.5-flash` with a generic "solve step by step" prompt. Flash misreads figures, diagrams, and handwritten symbols on hard problems.

Changes to `supabase/functions/analyze-text/index.ts`:
- When `imageData` is present, route to `google/gemini-2.5-pro` instead of `gemini-2.5-flash` (Pro has significantly stronger multimodal reasoning on diagrams). Text-only requests stay on Flash for speed/cost.
- Prepend a dedicated vision instruction block before the existing solve prompt:
  - "Before solving, list everything visible in the image: printed text, handwriting, numbers, symbols, units, figure elements (arrows, angles, labels, coordinates, forces, geometry). Transcribe the exact problem statement verbatim."
  - "If the image contains a figure/diagram, describe its geometry (points, lines, angles, given lengths, force directions) as structured `Given:` bullets before starting the solution."
  - "Never guess unreadable characters — say 'unclear' and pick the most physically reasonable interpretation, noting the assumption."
  - "Double-check numeric extraction: re-read each number twice from the image before using it."
- Keep the existing streaming path; only the model + prompt prefix change when an image is provided.
- Apply the same vision-first prompt upgrade to `structure-problem` and `ocr-handwriting` edge functions if they're on the image path (verify during build).

## Technical notes

- No schema or RLS changes.
- No new secrets; uses existing `LOVABLE_API_KEY` via the Gateway.
- Cost impact: image requests move from Flash → Pro (~higher per-call cost, but only on image submissions in Homework Help). Text tools unchanged.
- No client-side breaking changes — the sanitizer is additive inside `MarkdownRenderer`.

## Files touched
- `supabase/functions/analyze-text/index.ts` (model swap + vision prompt)
- `supabase/functions/solve-problem/index.ts`, `generate-quiz`, `generate-flashcards`, `generate-lecture-notes`, `generate-summary`, `generate-mindmap`, `newton-chat` (LaTeX hygiene block)
- `src/lib/latexSanitize.ts` (new)
- `src/components/MarkdownRenderer.tsx` (invoke sanitizer)
