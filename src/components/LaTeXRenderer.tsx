import { useEffect, useRef, memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const LaTeXRenderer = memo(function LaTeXRenderer({ 
  latex, 
  displayMode = false, 
  className = '' 
}: LaTeXRendererProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        let processedLatex = latex
          .replace(/\\\[/g, '')
          .replace(/\\\]/g, '')
          .replace(/\\\(/g, '')
          .replace(/\\\)/g, '');

        try {
          katex.render(processedLatex, containerRef.current, {
            throwOnError: false,
            displayMode,
            trust: false,
            strict: false,
          });
        } catch (err) {
          console.warn('KaTeX render failed for:', processedLatex, err);
          containerRef.current.innerHTML = `<span class="katex-error font-mono text-xs">${processedLatex}</span>`;
        }
      } catch (error) {
        console.error('LaTeX rendering error:', error);
        if (containerRef.current) {
          containerRef.current.textContent = latex;
        }
      }
    }
  }, [latex, displayMode]);

  return (
    <span 
      ref={containerRef} 
      className={`latex-content ${className}`}
    />
  );
});

interface MixedContentProps {
  content: string;
  className?: string;
}

export function MixedContent({ content, className = '' }: MixedContentProps) {
  if (!content) return null;

  const parts = splitIntoSegments(content);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'display') {
          return (
            <span key={index} className="math-display block my-3">
              <LaTeXRenderer latex={part.content} displayMode={true} />
            </span>
          );
        }
        if (part.type === 'inline') {
          return <LaTeXRenderer key={index} latex={part.content} displayMode={false} />;
        }
        return (
          <span
            key={index}
            dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(part.content) }}
          />
        );
      })}
    </span>
  );
}

type Segment = { type: 'text' | 'display' | 'inline'; content: string };

function splitIntoSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // Display math first (allow newlines inside $$...$$)
  const displayMathRegex = /\$\$([\s\S]+?)\$\$/g;
  const displayBlocks: { start: number; end: number; content: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = displayMathRegex.exec(text)) !== null) {
    displayBlocks.push({
      start: m.index,
      end: m.index + m[0].length,
      content: m[1].trim(),
    });
  }

  let lastIndex = 0;
  for (const block of displayBlocks) {
    if (block.start > lastIndex) {
      splitByInlineMath(text.slice(lastIndex, block.start), segments);
    }
    segments.push({ type: 'display', content: block.content });
    lastIndex = block.end;
  }
  if (lastIndex < text.length) {
    splitByInlineMath(text.slice(lastIndex), segments);
  }
  return segments.filter((s) => s.content.trim() !== '');
}

function splitByInlineMath(text: string, segments: Segment[]) {
  const inlineRegex = /\$([^\$\n\r]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = inlineRegex.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'text', content: text.slice(last, m.index) });
    }
    segments.push({ type: 'inline', content: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    segments.push({ type: 'text', content: text.slice(last) });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInlineMarkdown(text: string): string {
  let s = escapeHtml(text);
  // **bold**
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  // *italic* (avoid touching ** already replaced)
  s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  // newlines -> <br/>
  s = s.replace(/\n/g, '<br/>');
  return s;
}
