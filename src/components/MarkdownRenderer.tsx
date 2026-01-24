import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";
import { 
  Key, 
  FileText, 
  List, 
  Lightbulb, 
  BookOpen, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Sparkles,
  Brain,
  Layers,
  MessageSquare,
  GraduationCap,
  Zap,
  type LucideIcon
} from "lucide-react";
import { autoDetectLatex, shouldApplyLatex } from "@/utils/latexAutoDetect";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  enableAutoLatex?: boolean;
}

// Map heading text patterns to icons
const getHeadingIcon = (text: string): LucideIcon | null => {
  const lowerText = text.toLowerCase().trim();
  
  if (lowerText.includes('key point') || lowerText.includes('keypoint') || lowerText.includes('key takeaway')) {
    return Key;
  }
  if (lowerText.includes('summary') || lowerText.includes('conclusion') || lowerText.includes('recap')) {
    return FileText;
  }
  if (lowerText.includes('detail') || lowerText.includes('explanation') || lowerText.includes('description')) {
    return List;
  }
  if (lowerText.includes('overview') || lowerText.includes('introduction') || lowerText.includes('intro')) {
    return BookOpen;
  }
  if (lowerText.includes('objective') || lowerText.includes('goal') || lowerText.includes('aim')) {
    return Target;
  }
  if (lowerText.includes('solution') || lowerText.includes('answer') || lowerText.includes('result')) {
    return CheckCircle2;
  }
  if (lowerText.includes('important') || lowerText.includes('note') || lowerText.includes('warning') || lowerText.includes('caution')) {
    return AlertCircle;
  }
  if (lowerText.includes('question') || lowerText.includes('faq') || lowerText.includes('ask')) {
    return HelpCircle;
  }
  if (lowerText.includes('tip') || lowerText.includes('hint') || lowerText.includes('suggestion')) {
    return Lightbulb;
  }
  if (lowerText.includes('highlight') || lowerText.includes('feature')) {
    return Sparkles;
  }
  if (lowerText.includes('concept') || lowerText.includes('theory') || lowerText.includes('principle')) {
    return Brain;
  }
  if (lowerText.includes('step') || lowerText.includes('process') || lowerText.includes('procedure')) {
    return Layers;
  }
  if (lowerText.includes('discussion') || lowerText.includes('analysis')) {
    return MessageSquare;
  }
  if (lowerText.includes('learn') || lowerText.includes('study') || lowerText.includes('topic')) {
    return GraduationCap;
  }
  if (lowerText.includes('quick') || lowerText.includes('flash') || lowerText.includes('fast')) {
    return Zap;
  }
  
  return null;
};

// Helper to extract text from React children
const extractText = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map(extractText).join('');
  }
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText((children as React.ReactElement).props.children);
  }
  return '';
};

export const MarkdownRenderer = ({ content, className, enableAutoLatex = true }: MarkdownRendererProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Apply LaTeX auto-detection if enabled and content looks technical
  const processedContent = useMemo(() => {
    if (enableAutoLatex && shouldApplyLatex(content)) {
      return autoDetectLatex(content);
    }
    return content;
  }, [content, enableAutoLatex]);

  const renderHeadingWithIcon = (children: React.ReactNode, Tag: 'h1' | 'h2' | 'h3' | 'h4') => {
    const text = extractText(children);
    const Icon = getHeadingIcon(text);
    
    const iconSizes = {
      h1: 'h-6 w-6',
      h2: 'h-5 w-5',
      h3: 'h-4 w-4',
      h4: 'h-4 w-4'
    };
    
    return (
      <Tag className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex-shrink-0 p-1.5 rounded-lg bg-primary/10 text-primary">
            <Icon className={iconSizes[Tag]} />
          </span>
        )}
        <span>{children}</span>
      </Tag>
    );
  };

  return (
    <div
      className={cn(
        "prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none",
        // Enhanced typography
        "prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight",
        "prose-h1:text-2xl prose-h1:md:text-3xl prose-h1:mt-8 prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-border/50",
        "prose-h2:text-xl prose-h2:md:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-primary",
        "prose-h3:text-lg prose-h3:md:text-xl prose-h3:mt-6 prose-h3:mb-2",
        "prose-h4:text-base prose-h4:md:text-lg prose-h4:mt-4 prose-h4:mb-2 prose-h4:text-muted-foreground",
        // Body text
        "prose-p:font-sans prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:mb-4",
        "prose-li:font-sans prose-li:leading-relaxed prose-li:my-1.5",
        // Lists
        "prose-ul:my-4 prose-ul:pl-6 prose-ol:my-4 prose-ol:pl-6",
        "prose-li:marker:text-primary",
        // Links
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        // Strong & emphasis
        "prose-strong:font-semibold prose-strong:text-foreground",
        "prose-em:italic prose-em:text-muted-foreground",
        // Blockquotes
        "prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic",
        // Code
        "prose-code:before:content-none prose-code:after:content-none",
        // Tables
        "prose-table:border-collapse prose-th:bg-muted/50 prose-th:p-3 prose-td:p-3 prose-td:border-border",
        // KaTeX
        "[&_.katex]:text-base [&_.katex-display]:my-6 [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-2",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="bg-muted/70 text-primary px-1.5 py-0.5 rounded-md text-sm font-mono border border-border/50"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                style={isDark ? oneDark : oneLight}
                language={match?.[1] || "text"}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  padding: "1rem",
                }}
                codeTagProps={{
                  style: {
                    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
                  },
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          },
          pre({ children }) {
            return <div className="not-prose my-6 rounded-xl overflow-hidden border border-border/50">{children}</div>;
          },
          h1({ children }) {
            return renderHeadingWithIcon(children, 'h1');
          },
          h2({ children }) {
            return renderHeadingWithIcon(children, 'h2');
          },
          h3({ children }) {
            return renderHeadingWithIcon(children, 'h3');
          },
          h4({ children }) {
            return renderHeadingWithIcon(children, 'h4');
          },
          ul({ children }) {
            return <ul className="space-y-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="space-y-2">{children}</ol>;
          },
          li({ children }) {
            return <li className="pl-1">{children}</li>;
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
