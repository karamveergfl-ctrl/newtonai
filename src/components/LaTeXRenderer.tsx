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
        
        katex.render(processedLatex, containerRef.current, {
          throwOnError: false,
          displayMode,
          trust: true,
          strict: false,
        });
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

  const parts: { type: 'text' | 'display' | 'inline'; content: string }[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    
    const matched = match[0];
    if (matched.startsWith('$$') && matched.endsWith('$$')) {
      parts.push({ type: 'display', content: matched.slice(2, -2) });
    } else if (matched.startsWith('$') && matched.endsWith('$')) {
      parts.push({ type: 'inline', content: matched.slice(1, -1) });
    } else if (matched.startsWith('\\[') && matched.endsWith('\\]')) {
      parts.push({ type: 'display', content: matched.slice(2, -2) });
    } else if (matched.startsWith('\\(') && matched.endsWith('\\)')) {
      parts.push({ type: 'inline', content: matched.slice(2, -2) });
    }
    
    lastIndex = match.index + matched.length;
  }
  
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'display') {
          return (
            <span key={index} className="block my-3">
              <LaTeXRenderer latex={part.content} displayMode={true} />
            </span>
          );
        }
        if (part.type === 'inline') {
          return <LaTeXRenderer key={index} latex={part.content} displayMode={false} />;
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}
