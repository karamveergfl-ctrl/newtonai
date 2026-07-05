// Cleans common LaTeX output mistakes from AI models before Markdown/KaTeX rendering.
// Safe to run on any string; no-ops when nothing matches.

const UNIT_WORDS = [
  "kN", "MN", "GN", "mN",
  "kg", "mg", "g", "t",
  "km", "cm", "mm", "nm", "µm",
  "kHz", "MHz", "GHz", "Hz",
  "kJ", "MJ", "mJ", "J",
  "kW", "MW", "mW", "W",
  "kPa", "MPa", "GPa", "Pa",
  "mol", "rad", "deg",
  "mL", "L",
  "kV", "mV", "V",
  "kA", "mA", "A",
  "kΩ", "MΩ", "Ω",
];

function fixMathSegment(seg: string): string {
  let s = seg;
  // \cdot / \times / \pm / \div / \cdots directly followed by a letter → add spacing
  s = s.replace(/\\(cdot|cdots|times|div|pm|mp|approx|sim|leq|geq|neq)([a-zA-Z])/g, "\\$1\\,$2");
  // number then unit word directly juxtaposed → wrap unit in \text{}
  const unitRe = new RegExp(`([0-9)\\}])\\s*(${UNIT_WORDS.map(u => u.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")).join("|")})\\b`, "g");
  s = s.replace(unitRe, "$1\\,\\text{$2}");
  // bare unit right after \cdot / \times followed by space then unit word
  s = s.replace(/\\(cdot|times)\s+(k?N|m|s|kg|Hz|J|W|Pa|mol|cm|mm|km|rad)\b/g, "\\$1\\,\\text{$2}");
  return s;
}

export function sanitizeLatex(input: string): string {
  if (!input || typeof input !== "string") return input;
  let out = input;

  // Fix display math $$...$$
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_m, inner) => `$$${fixMathSegment(inner)}$$`);
  // Fix inline math $...$
  out = out.replace(/(^|[^\$])\$([^\$\n]+?)\$/g, (_m, pre, inner) => `${pre}$${fixMathSegment(inner)}$`);

  // Repair \cdotm / \timesm-style outside math (model sometimes forgets delimiters)
  out = out.replace(/\\(cdot|times|div|pm)([a-zA-Z])/g, "\\$1\\,$2");

  return out;
}
