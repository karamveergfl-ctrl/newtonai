/**
 * Auto LaTeX Detection Utility
 * Automatically detects and converts technical variables to LaTeX notation
 */

// Greek letter mappings
const GREEK_MAP: Record<string, string> = {
  alpha: "\\alpha",
  beta: "\\beta",
  gamma: "\\gamma",
  delta: "\\delta",
  epsilon: "\\epsilon",
  theta: "\\theta",
  lambda: "\\lambda",
  mu: "\\mu",
  pi: "\\pi",
  sigma: "\\sigma",
  omega: "\\omega",
  phi: "\\phi",
  psi: "\\psi",
  rho: "\\rho",
  tau: "\\tau",
  eta: "\\eta",
  zeta: "\\zeta",
  kappa: "\\kappa",
  nu: "\\nu",
  xi: "\\xi",
  chi: "\\chi",
};

// Common electronics/physics variable patterns
const COMMON_VARS = [
  "Vbe",
  "Vce",
  "Vcc",
  "Vdd",
  "Vss",
  "Vgs",
  "Vds",
  "Vth",
  "Ic",
  "Ib",
  "Ie",
  "Id",
  "Is",
  "Vz",
  "Iz",
  "Pz",
  "Rz",
  "If",
  "Vf",
  "Vr",
  "Ir",
  "Rb",
  "Rc",
  "Re",
  "Rs",
  "Rd",
  "Rl",
  "Av",
  "Ai",
  "Ap",
  "gm",
  "hfe",
  "hie",
  "hoe",
];

/**
 * Check if content already has the variable in LaTeX format
 */
const isAlreadyLatex = (text: string, position: number, length: number): boolean => {
  // Check if surrounded by $ signs
  const before = text.substring(Math.max(0, position - 1), position);
  const after = text.substring(position + length, position + length + 1);
  return before === "$" || after === "$";
};

/**
 * Automatically detects and converts technical variables to LaTeX notation
 * Examples:
 * - "Vz" → "$V_z$"
 * - "If" → "$I_F$"
 * - "Rb1" → "$R_{b1}$"
 * - "alpha" → "$\alpha$"
 */
export function autoDetectLatex(text: string): string {
  if (!text) return text;

  let result = text;

  // Skip if text seems to have a lot of existing LaTeX
  const existingLatexCount = (result.match(/\$[^$]+\$/g) || []).length;
  const textLength = result.length;
  if (existingLatexCount > textLength / 100) {
    // Already heavily formatted
    return result;
  }

  // Pattern 1: Common electronics/physics variables (Vbe, Ic, etc.)
  for (const v of COMMON_VARS) {
    const base = v[0].toUpperCase();
    const subscript = v.slice(1).toLowerCase();
    // Match word boundary but not already in LaTeX
    const regex = new RegExp(`(?<!\\$)\\b${v}\\b(?!\\$|_|\\{)`, "gi");
    result = result.replace(regex, (match) => {
      return `$${base}_{${subscript}}$`;
    });
  }

  // Pattern 2: Capital letter followed by lowercase subscript (Vz, If, Rb, Ic not in COMMON_VARS)
  // Match single capital + single lowercase that makes sense as a variable
  result = result.replace(
    /(?<!\$)\b([VIRPCELW])([a-z])(?![a-zA-Z$_])/g,
    (match, base, subscript, offset) => {
      // Skip if already processed or common words
      const commonWords = ["In", "It", "Is", "If", "We", "Re", "Vs", "Ie", "Pa"];
      if (commonWords.includes(match)) {
        // Check context - if followed by space and lowercase, it's probably a word
        const nextChars = result.substring(offset + match.length, offset + match.length + 2);
        if (/^\s+[a-z]/.test(nextChars)) {
          return match; // Keep as word
        }
      }
      // Check if in code block
      const beforeContext = result.substring(Math.max(0, offset - 10), offset);
      if (beforeContext.includes("`") || beforeContext.includes("$")) {
        return match;
      }
      return `$${base}_{${subscript}}$`;
    }
  );

  // Pattern 3: Variable with number subscript (R1, V2, C3, L1)
  result = result.replace(
    /(?<!\$)\b([VIRPCELTW])(\d+)\b(?!\$)/g,
    (match, base, num) => {
      return `$${base}_{${num}}$`;
    }
  );

  // Pattern 4: Greek letter names → symbols (full word only, not in code)
  Object.entries(GREEK_MAP).forEach(([name, symbol]) => {
    // Case insensitive but preserve the style
    const regex = new RegExp(`(?<!\$|\\\\)\\b${name}\\b(?!\\$)`, "gi");
    result = result.replace(regex, `$${symbol}$`);
  });

  // Pattern 5: Subscript notation like V_z, I_c (convert to proper LaTeX)
  result = result.replace(
    /(?<!\$)\b([A-Z])_([a-z0-9]+)\b(?!\$)/g,
    (match, base, subscript) => {
      return `$${base}_{${subscript}}$`;
    }
  );

  // Pattern 6: Superscript patterns like m^2, s^-1
  result = result.replace(
    /(?<!\$)\b([a-zA-Z]+)\^(-?\d+)\b(?!\$)/g,
    (match, base, exp) => {
      return `$${base}^{${exp}}$`;
    }
  );

  // Clean up double $$ that might occur
  result = result.replace(/\$\$/g, "$ $");

  return result;
}

/**
 * Check if LaTeX auto-detection should be applied based on content type
 * Returns true if content appears to be technical/scientific
 */
export function shouldApplyLatex(content: string): boolean {
  if (!content || content.length < 50) return false;

  // Check for technical indicators
  const technicalPatterns = [
    /\b(voltage|current|resistance|capacitance|inductance|impedance)\b/i,
    /\b(circuit|transistor|diode|semiconductor|amplifier|rectifier)\b/i,
    /\b(equation|formula|derivative|integral|differential)\b/i,
    /\b(physics|chemistry|mathematics|engineering|electronics)\b/i,
    /\b(frequency|wavelength|amplitude|phase|period)\b/i,
    /\b(force|mass|acceleration|velocity|momentum|energy)\b/i,
    /\b(temperature|pressure|volume|density)\b/i,
    /\b(coefficient|constant|variable|parameter)\b/i,
    /\b(ohm|volt|ampere|watt|farad|henry|hertz)\b/i,
    /\b(zener|breakdown|bias|forward|reverse)\b/i,
  ];

  const matchCount = technicalPatterns.filter((pattern) =>
    pattern.test(content)
  ).length;

  // Also check for existing variable-like patterns
  const hasVariablePatterns = /\b[VIRPC][a-z]\b|\b[VIRPC]\d\b/.test(content);

  return matchCount >= 2 || (matchCount >= 1 && hasVariablePatterns);
}
