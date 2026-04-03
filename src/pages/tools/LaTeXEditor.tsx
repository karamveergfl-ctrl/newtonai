import { useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Image, X, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

const SYMBOL_GROUPS = [
  {
    label: "Greek",
    symbols: [
      { display: "α", latex: "\\alpha" },
      { display: "β", latex: "\\beta" },
      { display: "γ", latex: "\\gamma" },
      { display: "δ", latex: "\\delta" },
      { display: "θ", latex: "\\theta" },
      { display: "λ", latex: "\\lambda" },
      { display: "μ", latex: "\\mu" },
      { display: "π", latex: "\\pi" },
      { display: "σ", latex: "\\sigma" },
      { display: "φ", latex: "\\phi" },
      { display: "ω", latex: "\\omega" },
      { display: "Σ", latex: "\\Sigma" },
      { display: "Δ", latex: "\\Delta" },
      { display: "Ω", latex: "\\Omega" },
    ],
  },
  {
    label: "Operators",
    symbols: [
      { display: "×", latex: "\\times" },
      { display: "÷", latex: "\\div" },
      { display: "±", latex: "\\pm" },
      { display: "∞", latex: "\\infty" },
      { display: "≤", latex: "\\leq" },
      { display: "≥", latex: "\\geq" },
      { display: "≠", latex: "\\neq" },
      { display: "≈", latex: "\\approx" },
      { display: "∈", latex: "\\in" },
      { display: "∉", latex: "\\notin" },
      { display: "⊂", latex: "\\subset" },
      { display: "∪", latex: "\\cup" },
      { display: "∩", latex: "\\cap" },
    ],
  },
  {
    label: "Structures",
    symbols: [
      { display: "a/b", latex: "\\frac{a}{b}" },
      { display: "x²", latex: "x^{2}" },
      { display: "xₙ", latex: "x_{n}" },
      { display: "√", latex: "\\sqrt{x}" },
      { display: "∫", latex: "\\int_{a}^{b}" },
      { display: "Σ", latex: "\\sum_{i=1}^{n}" },
      { display: "∏", latex: "\\prod_{i=1}^{n}" },
      { display: "lim", latex: "\\lim_{x \\to \\infty}" },
      { display: "[matrix]", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
      { display: "vec", latex: "\\vec{v}" },
      { display: "hat", latex: "\\hat{x}" },
      { display: "∂", latex: "\\partial" },
    ],
  },
];

const LaTeXEditor = () => {
  const navigate = useNavigate();
  const [latex, setLatex] = useState("E = mc^{2}");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const renderedHtml = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return '<span class="text-destructive text-sm">Invalid LaTeX</span>';
    }
  }, [latex]);

  const insertSymbol = useCallback((symbol: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setLatex((prev) => prev + symbol);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = latex.slice(0, start) + symbol + latex.slice(end);
    setLatex(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + symbol.length;
      ta.setSelectionRange(pos, pos);
    });
  }, [latex]);

  const handleCopyLatex = async () => {
    await navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("LaTeX copied!");
  };

  const handleCopyImage = async () => {
    try {
      const container = document.getElementById("katex-preview");
      if (!container) return;

      const canvas = document.createElement("canvas");
      const scale = 3;
      canvas.width = container.offsetWidth * scale;
      canvas.height = container.offsetHeight * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(scale, scale);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, container.offsetWidth, container.offsetHeight);

      // Use SVG foreignObject to render HTML to canvas
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${container.offsetWidth}" height="${container.offsetHeight}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:24px;display:flex;align-items:center;justify-content:center;height:100%;">
            ${renderedHtml}
          </div>
        </foreignObject>
      </svg>`;

      const img = new window.Image();
      img.onload = async () => {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            toast.success("Image copied to clipboard!");
          }
        }, "image/png");
      };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    } catch {
      toast.error("Failed to copy image. Try the LaTeX copy instead.");
    }
  };

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Tools", href: "/tools" },
    { name: "LaTeX Editor", href: "/tools/latex-editor" },
  ];

  return (
    <AppLayout>
      <SEOHead
        title="LaTeX Equation Editor"
        description="Write and preview LaTeX equations in real-time. Insert common math symbols with one click and copy as LaTeX or image."
        canonicalPath="/tools/latex-editor"
        breadcrumbs={breadcrumbs}
        keywords="LaTeX editor, equation editor, math symbols, KaTeX, math notation"
      />
      <div className="min-h-screen bg-background px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-4 sm:space-y-6"
        >
          <div className="relative text-center mb-4 sm:mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/tools")}
              className="absolute right-0 top-0 h-9 w-9 rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-xl bg-primary/10 mb-3 sm:mb-4">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">LaTeX Equation Editor</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Write equations with live preview
            </p>
          </div>

          {/* Symbol Palette */}
          <Card>
            <CardContent className="pt-4 pb-3">
              {SYMBOL_GROUPS.map((group) => (
                <div key={group.label} className="mb-3 last:mb-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.symbols.map((s) => (
                      <Button
                        key={s.latex}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-sm font-mono"
                        onClick={() => insertSymbol(s.latex)}
                        title={s.latex}
                      >
                        {s.display}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Editor + Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">LaTeX Input</p>
                <Textarea
                  ref={textareaRef}
                  value={latex}
                  onChange={(e) => setLatex(e.target.value)}
                  className="font-mono text-sm min-h-[200px] resize-y"
                  placeholder="Type LaTeX here..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
                <div
                  id="katex-preview"
                  className="min-h-[200px] flex items-center justify-center p-6 bg-muted/30 rounded-lg overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCopyLatex} variant="outline" className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy LaTeX"}
            </Button>
            <Button onClick={handleCopyImage} variant="outline" className="gap-2">
              <Image className="h-4 w-4" />
              Copy as Image
            </Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default LaTeXEditor;
