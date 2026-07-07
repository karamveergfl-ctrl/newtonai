// Normalizes AI-produced LaTeX so KaTeX can render it. Non-destructive: preserves
// valid commands and math line breaks. Intentionally minimal after over-aggressive
// prior versions corrupted correct expressions.

export function sanitizeLatex(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let result = text;

  // 1. Normalize display math \[ \] -> $$ $$
  //    NOTE: In String.replace, "$$" means a literal "$", so we need "$$$$" to emit "$$".
  result = result.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$');

  // 2. Normalize inline math \( \) -> $ $
  result = result.replace(/\\\(/g, '$$').replace(/\\\)/g, '$$');

  // 3. Repair double-escaped KaTeX commands (\\frac -> \frac). Do NOT touch
  //    bare \\ which is the LaTeX line-break inside math.
  result = result.replace(/\\\\(frac|sqrt|sum|int|oint|prod|lim|sin|cos|tan|log|ln|exp|text|mathrm|mathbf|vec|hat|bar|dot|ddot|tilde|left|right|cdot|times|div|pm|mp|leq|geq|neq|approx|equiv|infty|partial|nabla|Delta|Sigma|Pi|Omega|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|psi|omega|boxed|underbrace|overbrace|overrightarrow|overleftarrow|rightarrow|leftarrow|Rightarrow|Leftarrow|leftrightarrow|uparrow|downarrow|ldots|cdots|vdots|ddots)/g, '\\$1');

  // 4. Fix `\text {kN}` / `\mathrm {N}` (stray space before brace)
  result = result.replace(/\\text\s+\{/g, '\\text{');
  result = result.replace(/\\mathrm\s+\{/g, '\\mathrm{');

  // 5. Strip zero-width / null characters that break parsing
  result = result.replace(/\u0000/g, '').replace(/\u200B/g, '').replace(/\uFEFF/g, '');

  return result;
}

export function sanitizeStep(step: { title?: string; content?: string; explanation?: string }) {
  return {
    ...step,
    title: step.title ? sanitizeLatex(step.title) : '',
    content: step.content ? sanitizeLatex(step.content) : '',
    explanation: step.explanation ? sanitizeLatex(step.explanation) : '',
  };
}
