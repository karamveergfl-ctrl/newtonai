import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Sparkles, Loader2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NewtonSection {
  heading: string | null;
  content: string;
  sectionNumber: number | null;
}

interface NewtonResponseSectionProps {
  section: NewtonSection;
  onExplain: (heading: string, content: string) => Promise<string>;
}

export const NewtonResponseSection = memo(function NewtonResponseSection({
  section,
  onExplain,
}: NewtonResponseSectionProps) {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleExplainClick = async () => {
    if (!section.heading) return;
    
    setIsExplaining(true);
    try {
      const explanation = await onExplain(section.heading, section.content);
      setAiExplanation(explanation);
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      setAiExplanation('Failed to get explanation. Please try again.');
    } finally {
      setIsExplaining(false);
    }
  };

  // If no heading, render as plain content
  if (!section.heading) {
    return (
      <div className="text-sm">
        <MarkdownRenderer content={section.content} />
      </div>
    );
  }

  const ExplainButton = () => (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleExplainClick}
      disabled={isExplaining}
      className="h-7 px-2 text-xs gap-1 shrink-0 whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity bg-primary/5 hover:bg-primary/10"
    >
      {isExplaining ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3 text-primary" />
      )}
      Explain<span className="hidden sm:inline"> by AI</span>
    </Button>
  );

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden my-2 group shadow-sm w-full min-w-0">
      {/* Section Header with top Explain button */}
      <div className="flex items-center justify-between gap-2 p-3 bg-muted/30 border-b border-border/40">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left flex-1 min-w-0 hover:opacity-80 transition-opacity"
        >
          {section.sectionNumber !== null && (
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shrink-0">
              {section.sectionNumber}
            </span>
          )}
          <BookOpen className="w-4 h-4 text-primary shrink-0" />
          <h4 className="font-semibold text-sm text-foreground truncate">
            {section.heading}
          </h4>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
          )}
        </button>
        <ExplainButton />
      </div>

      {/* Section Content */}
      <div className={cn(
        "transition-all duration-200 overflow-hidden",
        isExpanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-4 text-sm min-w-0">
          <div className="prose prose-sm dark:prose-invert max-w-none break-words [overflow-wrap:anywhere] [&_.katex-display]:overflow-x-auto [&_.katex]:max-w-full">
            <MarkdownRenderer content={section.content} />
          </div>
        </div>

        {/* AI Explanation */}
        {aiExplanation && (
          <div className="mx-4 mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Explanation
            </div>
            <div className="text-sm">
              <MarkdownRenderer content={aiExplanation} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
});

/**
 * Parse Newton AI response into structured sections
 * Handles markdown headers (##, ###) and numbered sections (1., 2., etc.)
 */
export function parseNewtonSections(content: string): NewtonSection[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  // Split by common section patterns
  // Patterns: ## Heading, ### Heading, 1. Heading, **1. Heading**
  const sectionRegex = /(?:^|\n)(#{2,3}\s+[^\n]+|(?:\*\*)?(?:\d+)\.\s+[^\n]+(?:\*\*)?)/g;
  
  const matches = [...content.matchAll(sectionRegex)];
  
  if (matches.length === 0) {
    // No sections found, return as single block
    return [{ heading: null, content: content.trim(), sectionNumber: null }];
  }

  const sections: NewtonSection[] = [];
  let lastIndex = 0;

  // Check for intro content before first section
  const firstMatchIndex = matches[0].index ?? 0;
  if (firstMatchIndex > 0) {
    const introContent = content.substring(0, firstMatchIndex).trim();
    if (introContent.length > 0) {
      sections.push({ heading: null, content: introContent, sectionNumber: null });
    }
  }

  matches.forEach((match, idx) => {
    const matchStart = match.index ?? 0;
    const matchEnd = matchStart + match[0].length;
    
    // Find the end of this section (start of next section or end of content)
    const nextMatch = matches[idx + 1];
    const sectionEnd = nextMatch ? (nextMatch.index ?? content.length) : content.length;
    
    // Extract heading from the match
    let headingText = match[1].trim();
    
    // Clean up heading
    headingText = headingText
      .replace(/^#{2,3}\s*/, '') // Remove markdown headers
      .replace(/^\*\*/, '').replace(/\*\*$/, '') // Remove bold markers
      .trim();
    
    // Extract section number if present
    const numberMatch = headingText.match(/^(\d+)\.\s*/);
    let sectionNumber: number | null = null;
    if (numberMatch) {
      sectionNumber = parseInt(numberMatch[1]);
      headingText = headingText.replace(/^\d+\.\s*/, '').trim();
    }
    
    // Get section content (everything after the heading until next section)
    const sectionContent = content.substring(matchEnd, sectionEnd).trim();
    
    sections.push({
      heading: headingText,
      content: sectionContent,
      sectionNumber,
    });
  });

  return sections.filter(s => s.content.length > 0 || s.heading);
}
