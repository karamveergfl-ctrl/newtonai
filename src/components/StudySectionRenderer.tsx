import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
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
  GraduationCap
} from 'lucide-react';

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

const SectionCard = ({ section, index }: { section: StudySection; index: number }) => {
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
        {/* Section Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 dark:bg-muted/20 border-b border-border/30">
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
        </div>
        
        {/* Section Content */}
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
              remarkPlugins={[remarkMath]} 
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
      </div>
    </motion.div>
  );
};

const ExecutiveSummaryCard = ({ content }: { content: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-6"
  >
    <div className="bg-gradient-to-br from-primary/5 via-card to-secondary/5 rounded-xl border border-primary/20 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">Executive Summary</h3>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/85 leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  </motion.div>
);

const KeyTakeawaysCard = ({ content }: { content: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="mt-6"
  >
    <div className="bg-gradient-to-br from-emerald-500/10 via-card to-teal-500/10 rounded-xl border border-emerald-500/30 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">Key Takeaways</h3>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none [&_li]:text-foreground/90 [&_strong]:text-foreground">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  </motion.div>
);

export const StudySectionRenderer = ({ content, className, type = 'summary' }: StudySectionRendererProps) => {
  const parsed = parseStudyContent(content);
  
  // If no structured content found, fall back to basic markdown
  if (!parsed.executiveSummary && parsed.sections.length === 0 && !parsed.keyTakeaways) {
    return (
      <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Executive Summary */}
      {parsed.executiveSummary && (
        <ExecutiveSummaryCard content={parsed.executiveSummary} />
      )}
      
      {/* Numbered Sections */}
      {parsed.sections.length > 0 && (
        <div className="space-y-4">
          {parsed.sections.map((section, index) => (
            <SectionCard key={section.sectionNumber} section={section} index={index} />
          ))}
        </div>
      )}
      
      {/* Key Takeaways */}
      {parsed.keyTakeaways && (
        <KeyTakeawaysCard content={parsed.keyTakeaways} />
      )}
    </div>
  );
};

export default StudySectionRenderer;
