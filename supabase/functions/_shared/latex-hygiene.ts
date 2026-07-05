// Shared instruction block appended to system prompts of all AI generation
// edge functions. Enforces clean LaTeX + prose to eliminate rendering errors
// like `\cdotm`, unbalanced `$`, and markdown-inside-math.

export const LATEX_HYGIENE = `

STRICT OUTPUT HYGIENE — non-negotiable, apply before returning:
1. LaTeX control words (\\cdot, \\times, \\div, \\pm, \\sum, \\int, \\frac, etc.)
   MUST be followed by a space, {}, or a non-letter. NEVER write \\cdotm or \\timesN.
   Correct: $2.5\\,\\text{m}$, $F \\cdot d$, $138.46\\,\\text{kN}\\cdot 2.5\\,\\text{m}$.
2. Units MUST be wrapped as \\,\\text{unit}: write $9.8\\,\\text{m/s}^2$, not $9.8 m/s^2$.
3. Every $ and $$ MUST be balanced. Never leave a stray $ at the end of a line.
4. NEVER mix markdown (**, *, _) INSIDE $...$ or $$...$$.
5. Proofread every sentence for spelling, grammar, missing words, and duplicated
   punctuation before returning. No half-words, no "the the", no trailing commas.
6. Numbers must be consistent — if you compute a value in one step, reuse the
   exact same value (not a re-rounded variant) in later steps.
7. Do not invent facts. If unsure, say so explicitly.
`;
