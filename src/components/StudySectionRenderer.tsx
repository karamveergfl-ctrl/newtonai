import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Lightbulb, 
  ListChecks,
  FileText,
  CheckCircle2,
  BookMarked,
  Sparkles,
  GraduationCap,
  ChevronDown,
  Printer,
  Download,
  FileImage,
  FileType,
  Loader2,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  downloadMarkdown, 
  downloadText, 
  downloadPDF, 
  downloadPNG,
  downloadDOCX,
  copyToClipboard
} from '@/utils/studyContentExport';

interface StudySection {
  sectionNumber: number;
  title: string;
  coreIdea?: string;
  content: string;
  icon?: string;
}

interface ParsedStudyContent {
  executiveSummary?: string;
  sections: StudySection[];
  keyTakeaways?: string;
}

interface StudySectionRendererProps {
  content: string;
  className?: string;
  type?: 'summary' | 'lecture';
}

const sectionColors = [
  "bg-teal-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-rose-500",
];

const getSectionIcon = (title: string): React.ElementType => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('overview') || lowerTitle.includes('introduction')) return BookOpen;
  if (lowerTitle.includes('concept') || lowerTitle.includes('key point')) return Lightbulb;
  if (lowerTitle.includes('term') || lowerTitle.includes('definition') || lowerTitle.includes('glossary')) return BookMarked;
  if (lowerTitle.includes('example') || lowerTitle.includes('application')) return Sparkles;
  if (lowerTitle.includes('takeaway') || lowerTitle.includes('conclusion') || lowerTitle.includes('summary')) return CheckCircle2;
  if (lowerTitle.includes('note') || lowerTitle.includes('detail')) return FileText;
  if (lowerTitle.includes('study') || lowerTitle.includes('tip')) return GraduationCap;
  return ListChecks;
};

function parseStudyContent(content: string): ParsedStudyContent {
  const result: ParsedStudyContent = { sections: [] };
  
  // Extract Executive Summary
  const execMatch = content.match(/##?\s*(?:📋\s*)?Executive\s*Summary\n([\s\S]*?)(?=##\s*\d+\.|##\s*[📚🔑📝📖💡✅📌🎯📋📊🔍📈]|$)/i);
  if (execMatch) {
    result.executiveSummary = execMatch[1].trim();
  }
  
  // Also try to match "Overview" as executive summary if no executive summary found
  if (!result.executiveSummary) {
    const overviewMatch = content.match(/##?\s*(?:📚\s*)?Overview\n([\s\S]*?)(?=##\s*\d+\.|##\s*[📚🔑📝📖💡✅📌🎯📋📊🔍📈]|$)/i);
    if (overviewMatch) {
      result.executiveSummary = overviewMatch[1].trim();
    }
  }
  
  // Extract numbered sections: ## 1. Title, ## 2. Title
  const sectionPattern = /##\s*(\d+)\.\s*(.+?)\n([\s\S]*?)(?=##\s*\d+\.|##\s*(?:Key\s*)?Takeaway|##\s*[📚🔑📝📖💡✅📌🎯📋📊🔍📈].*Takeaway|$)/gi;
  let match;
  while ((match = sectionPattern.exec(content)) !== null) {
    const sectionNum = parseInt(match[1]);
    const title = match[2].trim().replace(/^[📚🔑📝📖💡✅📌🎯📋📊🔍📈]\s*/, '');
    let sectionContent = match[3].trim();
    
    // Extract Core Idea for EXPLANATION callout
    let coreIdea: string | undefined;
    const coreMatch = sectionContent.match(/\*\*Core\s*Idea:\*\*\s*(.+?)(?:\n\n|\n(?=\*\*|\-|\#)|$)/i);
    if (coreMatch) {
      coreIdea = coreMatch[1].trim();
      sectionContent = sectionContent.replace(coreMatch[0], '').trim();
    }
    
    result.sections.push({
      sectionNumber: sectionNum,
      title,
      coreIdea,
      content: sectionContent
    });
  }
  
  // If no numbered sections found, try to parse by emoji headers
  if (result.sections.length === 0) {
    const emojiSectionPattern = /##\s*([📚🔑📝📖💡✅📌🎯📋📊🔍📈])\s*(.+?)\n([\s\S]*?)(?=##\s*[📚🔑📝📖💡✅📌🎯📋📊🔍📈]|$)/gi;
    let sectionNum = 1;
    while ((match = emojiSectionPattern.exec(content)) !== null) {
      const title = match[2].trim();
      let sectionContent = match[3].trim();
      
      // Skip if this is the executive summary/overview we already captured
      if (title.toLowerCase().includes('executive summary') || 
          (title.toLowerCase().includes('overview') && result.executiveSummary)) {
        continue;
      }
      
      // Skip key takeaways - handle separately
      if (title.toLowerCase().includes('takeaway')) {
        result.keyTakeaways = sectionContent;
        continue;
      }
      
      // Extract Core Idea
      let coreIdea: string | undefined;
      const coreMatch = sectionContent.match(/\*\*Core\s*Idea:\*\*\s*(.+?)(?:\n\n|\n(?=\*\*|\-|\#)|$)/i);
      if (coreMatch) {
        coreIdea = coreMatch[1].trim();
        sectionContent = sectionContent.replace(coreMatch[0], '').trim();
      }
      
      result.sections.push({
        sectionNumber: sectionNum++,
        title,
        coreIdea,
        content: sectionContent
      });
    }
  }
  
  // Extract Key Takeaways
  if (!result.keyTakeaways) {
    const takeawayMatch = content.match(/##?\s*(?:[📚🔑📝📖💡✅📌🎯📋📊🔍📈]\s*)?(?:Key\s*)?Takeaways?\n([\s\S]*?)$/i);
    if (takeawayMatch) {
      result.keyTakeaways = takeawayMatch[1].trim();
    }
  }
  
  return result;
}

const SectionCard = ({ 
  section, 
  index,
  isExpanded,
  onToggle
}: { 
  section: StudySection; 
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const colorClass = sectionColors[index % sectionColors.length];
  const IconComponent = getSectionIcon(section.title);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative"
    >
      <div className="bg-card/80 dark:bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Section Header - Clickable */}
        <div 
          onClick={onToggle}
          className="flex items-center justify-between px-4 py-3 bg-muted/30 dark:bg-muted/20 border-b border-border/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-semibold shadow-sm",
              colorClass
            )}>
              {section.sectionNumber}
            </span>
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground tracking-tight">
                {section.title}
              </h3>
            </div>
          </div>
          
          {/* Chevron Icon */}
          <ChevronDown className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )} />
        </div>
        
        {/* Section Content - Collapsible */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="p-4 md:p-5 space-y-4">
                {/* EXPLANATION Callout (Core Idea) */}
                {section.coreIdea && (
                  <div className="border-l-4 border-primary/50 bg-primary/5 dark:bg-primary/10 p-3 rounded-r-lg">
                    <span className="text-primary font-semibold text-sm uppercase tracking-wide">Explanation:</span>
                    <p className="text-foreground/85 mt-1 text-sm leading-relaxed">{section.coreIdea}</p>
                  </div>
                )}
                
                {/* Main Content */}
                <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full divide-y divide-border text-sm">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-muted/50">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-3 py-2 text-left font-semibold text-foreground">{children}</th>
                      ),
                      td: ({ children }) => (
                        <td className="px-3 py-2 border-t border-border/50">{children}</td>
                      ),
                      ul: ({ children }) => (
                        <ul className="space-y-1.5 my-2 list-disc list-inside">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-foreground/90">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                      h3: ({ children }) => (
                        <h4 className="font-semibold text-foreground mt-4 mb-2">{children}</h4>
                      ),
                      h4: ({ children }) => (
                        <h5 className="font-medium text-foreground/90 mt-3 mb-1.5">{children}</h5>
                      ),
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const ExecutiveSummaryCard = ({ 
  content, 
  isExpanded, 
  onToggle 
}: { 
  content: string; 
  isExpanded: boolean; 
  onToggle: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-6"
  >
    <div className="bg-gradient-to-br from-primary/5 via-card to-secondary/5 rounded-xl border border-primary/20 shadow-sm overflow-hidden">
      {/* Clickable Header */}
      <div 
        onClick={onToggle}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">Executive Summary</h3>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground transition-transform duration-200",
          isExpanded && "rotate-180"
        )} />
      </div>
      
      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 prose prose-sm dark:prose-invert max-w-none text-foreground/85 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {content}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>
);

const KeyTakeawaysCard = ({ 
  content, 
  isExpanded, 
  onToggle 
}: { 
  content: string; 
  isExpanded: boolean; 
  onToggle: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="mt-6"
  >
    <div className="bg-gradient-to-br from-emerald-500/10 via-card to-teal-500/10 rounded-xl border border-emerald-500/30 shadow-sm overflow-hidden">
      {/* Clickable Header */}
      <div 
        onClick={onToggle}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-emerald-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">Key Takeaways</h3>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground transition-transform duration-200",
          isExpanded && "rotate-180"
        )} />
      </div>
      
      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 prose prose-sm dark:prose-invert max-w-none [&_li]:text-foreground/90 [&_strong]:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {content}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>
);

export const StudySectionRenderer = ({ content, className, type = 'summary' }: StudySectionRendererProps) => {
  const parsed = parseStudyContent(content);
  
  // State for expanded sections - all expanded by default
  // Start with all sections COLLAPSED by default
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [takeawaysExpanded, setTakeawaysExpanded] = useState(false);
  
  const toggleSection = (sectionNumber: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionNumber)) {
        newSet.delete(sectionNumber);
      } else {
        newSet.add(sectionNumber);
      }
      return newSet;
    });
  };
  
  const expandAll = () => {
    setExpandedSections(new Set(parsed.sections.map(s => s.sectionNumber)));
    setSummaryExpanded(true);
    setTakeawaysExpanded(true);
  };
  
  const collapseAll = () => {
    setExpandedSections(new Set());
    setSummaryExpanded(false);
    setTakeawaysExpanded(false);
  };
  
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const handlePrintPDF = useCallback(() => {
    // First expand all sections
    expandAll();
    
    // Wait for animations to complete before printing
    setTimeout(() => {
      // Add print-specific class to body
      document.body.classList.add('printing-study-content');
      
      window.print();
      
      // Remove class after print dialog closes
      setTimeout(() => {
        document.body.classList.remove('printing-study-content');
      }, 500);
      
      toast({
        title: "Print Ready",
        description: "All sections expanded for printing",
      });
    }, 300);
  }, [expandAll, toast]);

  const handleDownloadMarkdown = useCallback(() => {
    downloadMarkdown(content, `study-notes-${Date.now()}`);
    toast({ title: "Downloaded", description: "Markdown file saved" });
  }, [content, toast]);

  const handleDownloadText = useCallback(() => {
    downloadText(content, `study-notes-${Date.now()}`);
    toast({ title: "Downloaded", description: "Text file saved" });
  }, [content, toast]);

  const handleDownloadPDF = useCallback(async () => {
    if (!contentRef.current) return;
    setIsExporting(true);
    expandAll();
    
    await new Promise(r => setTimeout(r, 300)); // Wait for expand animation
    
    try {
      await downloadPDF(contentRef.current, `study-notes-${Date.now()}`);
      toast({ title: "Downloaded", description: "PDF file saved" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [contentRef, expandAll, toast]);

  const handleDownloadPNG = useCallback(async () => {
    if (!contentRef.current) return;
    setIsExporting(true);
    expandAll();
    
    await new Promise(r => setTimeout(r, 300));
    
    try {
      await downloadPNG(contentRef.current, `study-notes-${Date.now()}`);
      toast({ title: "Downloaded", description: "Image saved" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [contentRef, expandAll, toast]);

  const handleDownloadDOCX = useCallback(async () => {
    setIsExporting(true);
    try {
      await downloadDOCX(content, `study-notes-${Date.now()}`);
      toast({ title: "Downloaded", description: "Word document saved" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate Word document", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [content, toast]);

  const handleCopyToClipboard = useCallback(async () => {
    const success = await copyToClipboard(content);
    if (success) {
      toast({ title: "Copied", description: "Content copied to clipboard" });
    } else {
      toast({ title: "Error", description: "Failed to copy to clipboard", variant: "destructive" });
    }
  }, [content, toast]);
  
  // If no structured content found, fall back to basic markdown
  if (!parsed.executiveSummary && parsed.sections.length === 0 && !parsed.keyTakeaways) {
    return (
      <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }
  
  return (
    <div ref={contentRef} className={cn("space-y-4 print-study-content", className)}>
      {/* Expand/Collapse All Controls */}
      {(parsed.sections.length > 1 || parsed.executiveSummary || parsed.keyTakeaways) && (
        <div className="flex justify-between items-center gap-2 mb-2 print:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={isExporting}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded hover:bg-muted/50 border border-border/50 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover z-50">
              <DropdownMenuItem onClick={handleCopyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <FileText className="mr-2 h-4 w-4" />
                PDF Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadDOCX}>
                <FileText className="mr-2 h-4 w-4" />
                Word Document (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadMarkdown}>
                <FileType className="mr-2 h-4 w-4" />
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadText}>
                <FileText className="mr-2 h-4 w-4" />
                Plain Text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPNG}>
                <FileImage className="mr-2 h-4 w-4" />
                Image (PNG)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePrintPDF}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/50"
            >
              Expand All
            </button>
            <span className="text-muted-foreground/50">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/50"
            >
              Collapse All
            </button>
          </div>
        </div>
      )}
      
      {/* Executive Summary */}
      {parsed.executiveSummary && (
        <ExecutiveSummaryCard 
          content={parsed.executiveSummary} 
          isExpanded={summaryExpanded}
          onToggle={() => setSummaryExpanded(!summaryExpanded)}
        />
      )}
      
      {/* Numbered Sections */}
      {parsed.sections.length > 0 && (
        <div className="space-y-4">
          {parsed.sections.map((section, index) => (
            <SectionCard 
              key={section.sectionNumber} 
              section={section} 
              index={index}
              isExpanded={expandedSections.has(section.sectionNumber)}
              onToggle={() => toggleSection(section.sectionNumber)}
            />
          ))}
        </div>
      )}
      
      {/* Key Takeaways */}
      {parsed.keyTakeaways && (
        <KeyTakeawaysCard 
          content={parsed.keyTakeaways}
          isExpanded={takeawaysExpanded}
          onToggle={() => setTakeawaysExpanded(!takeawaysExpanded)}
        />
      )}
    </div>
  );
};

export default StudySectionRenderer;
