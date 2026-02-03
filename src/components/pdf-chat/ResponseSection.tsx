import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { BookOpen, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface ParsedSection {
  heading: string | null;
  pageNumber: number | null;
  content: string;
  rawContent: string;
}

interface ResponseSectionProps {
  section: ParsedSection;
  documentId: string | null;
  sessionId: string | null;
  onCitationClick?: (pageNumber: number, quote: string) => void;
}

export function ResponseSection({
  section,
  documentId,
  sessionId,
  onCitationClick,
}: ResponseSectionProps) {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleExplainClick = async () => {
    if (!section.heading || !documentId) return;
    
    setIsExplaining(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-with-content', {
        body: {
          question: `Explain "${section.heading}" in simple terms that a student can understand. Give a brief but clear explanation with examples if possible.`,
          pdfContext: section.content,
          pdfName: 'Document Section',
          conversationHistory: [],
        },
      });

      if (error) throw error;
      setAiExplanation(data?.answer || 'Unable to generate explanation.');
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      setAiExplanation('Failed to get explanation. Please try again.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handlePageClick = () => {
    if (section.pageNumber && onCitationClick) {
      onCitationClick(section.pageNumber, section.content.slice(0, 100));
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

  return (
    <div className="border-l-4 border-primary/30 pl-4 my-4 group">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left flex-1 hover:opacity-80 transition-opacity"
        >
          <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <h4 className="font-semibold text-primary">
            {section.heading}
          </h4>
          {section.pageNumber && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                handlePageClick();
              }}
            >
              Page {section.pageNumber}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExplainClick}
          disabled={isExplaining}
          className="h-7 px-2 text-xs gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
        >
          {isExplaining ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          Explain by AI
        </Button>
      </div>

      {/* Section Content */}
      <div className={cn(
        "transition-all duration-200 overflow-hidden",
        isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="text-sm">
          <MarkdownRenderer content={section.content} />
        </div>

        {/* AI Explanation */}
        {aiExplanation && (
          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
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
}

// Utility function to parse response into sections
export function parseResponseSections(content: string): ParsedSection[] {
  // Split by section dividers (---)
  const rawSections = content.split(/\n---\n/).filter(s => s.trim());
  
  if (rawSections.length === 0) {
    return [{ heading: null, pageNumber: null, content, rawContent: content }];
  }

  const sections: ParsedSection[] = [];
  
  for (const rawSection of rawSections) {
    const trimmed = rawSection.trim();
    
    // Try to match heading with page number: ## Topic Name [Page X]
    const headerMatch = trimmed.match(/^##\s+(.+?)\s*\[Page\s*(\d+)\]/m);
    
    if (headerMatch) {
      const heading = headerMatch[1].trim();
      const pageNumber = parseInt(headerMatch[2]);
      // Remove the header line from content
      const contentWithoutHeader = trimmed.replace(/^##\s+.+?\[Page\s*\d+\].*$/m, '').trim();
      
      sections.push({
        heading,
        pageNumber,
        content: contentWithoutHeader,
        rawContent: trimmed,
      });
    } else {
      // Try simpler heading format: ## Topic Name
      const simpleHeaderMatch = trimmed.match(/^##\s+(.+)$/m);
      
      if (simpleHeaderMatch) {
        const heading = simpleHeaderMatch[1].trim();
        // Extract page number from content if present
        const pageInContent = trimmed.match(/\[Page\s*(\d+)\]/);
        const pageNumber = pageInContent ? parseInt(pageInContent[1]) : null;
        const contentWithoutHeader = trimmed.replace(/^##\s+.+$/m, '').trim();
        
        sections.push({
          heading,
          pageNumber,
          content: contentWithoutHeader,
          rawContent: trimmed,
        });
      } else {
        // No heading found, use as-is
        // Extract any page reference
        const pageMatch = trimmed.match(/\[Page\s*(\d+)\]/);
        
        sections.push({
          heading: null,
          pageNumber: pageMatch ? parseInt(pageMatch[1]) : null,
          content: trimmed,
          rawContent: trimmed,
        });
      }
    }
  }

  return sections.length > 0 ? sections : [{ heading: null, pageNumber: null, content, rawContent: content }];
}
