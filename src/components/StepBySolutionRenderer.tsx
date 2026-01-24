import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { HelpCircle, ChevronDown, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import "katex/dist/katex.min.css";

// Clean up content to fix common formatting issues
function cleanMathContent(text: string): string {
  return text
    // Fix raw asterisks that should be bold - ensure no spaces break the markdown
    .replace(/\*\*\s+/g, '**')
    .replace(/\s+\*\*/g, '**')
    // Convert plain multiplication symbols to LaTeX (only between numbers)
    .replace(/(\d+)\s*\*\s*(\d+)/g, '$$$1 \\times $2$$')
    // Fix standalone operators that aren't in LaTeX
    .replace(/(?<!\$)\s*×\s*(?!\$)/g, ' $\\times$ ')
    .replace(/(?<!\$)\s*÷\s*(?!\$)/g, ' $\\div$ ')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface StepBySolutionRendererProps {
  content: string;
  className?: string;
}

interface SolutionStep {
  stepNumber: number;
  title: string;
  content: string;
}

interface ParsedSolution {
  problem?: string;
  given?: string;
  find?: string;
  steps: SolutionStep[];
  finalAnswer?: string;
}

const stepColors = [
  "bg-purple-500",
  "bg-blue-500", 
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-rose-500",
];

// Generate detailed explanation for a step
function generateDetailedExplanation(step: SolutionStep): string {
  const explanations: string[] = [];
  
  // Add conceptual explanation
  explanations.push(`**Why this step?**\nThis step is crucial because it ${step.title.toLowerCase().includes('equation') ? 'establishes the mathematical relationship' : step.title.toLowerCase().includes('diagram') ? 'visualizes the problem setup' : 'builds upon previous work'} to move us closer to the solution.`);
  
  // Add key concepts
  explanations.push(`**Key Concepts:**\n- Break down complex problems into manageable parts\n- Apply fundamental principles systematically\n- Verify each calculation before proceeding`);
  
  // Add tips
  explanations.push(`**💡 Pro Tip:**\nAlways double-check your work by substituting your answer back into the original equation to verify it satisfies all conditions.`);
  
  return explanations.join('\n\n');
}

function parseSolution(content: string): ParsedSolution {
  const result: ParsedSolution = { steps: [] };
  
  // Clean up the content first
  const cleanedContent = cleanMathContent(content);
  
  // Extract Problem section
  const problemMatch = cleanedContent.match(/(?:^|\n)(?:##?\s*)?(?:\*\*)?Problem(?:\*\*)?[:\s]*([\s\S]*?)(?=\n(?:##?\s*)?(?:\*\*)?(?:Given|Find|Solution|Step|Quick Solution)|\n##|$)/i);
  if (problemMatch) {
    result.problem = problemMatch[1].trim();
  }
  
  // Extract Given section
  const givenMatch = cleanedContent.match(/(?:^|\n)(?:##?\s*)?(?:\*\*)?Given(?:\*\*)?[:\s]*([\s\S]*?)(?=\n(?:##?\s*)?(?:\*\*)?(?:Find|Solution|Step)|\n##|$)/i);
  if (givenMatch) {
    result.given = givenMatch[1].trim();
  }
  
  // Extract Find section
  const findMatch = cleanedContent.match(/(?:^|\n)(?:##?\s*)?(?:\*\*)?Find(?:\*\*)?[:\s]*([\s\S]*?)(?=\n(?:##?\s*)?(?:\*\*)?(?:Solution|Step)|\n##|$)/i);
  if (findMatch) {
    result.find = findMatch[1].trim();
  }
  
  // Extract steps - look for various step patterns
  const stepPatterns = [
    /(?:^|\n)###?\s*(?:Step\s*)?(\d+)[.:\s-]*(.+?)(?:\n)([\s\S]*?)(?=\n###?\s*(?:Step\s*)?\d+|\n###?\s*(?:Final|Answer|Conclusion|Result)|$)/gi,
    /(?:^|\n)\*\*(?:Step\s*)?(\d+)[.:\s-]*(.+?)\*\*[:\s]*([\s\S]*?)(?=\n\*\*(?:Step\s*)?\d+|\n\*\*(?:Final|Answer|Conclusion|Result)|$)/gi,
    /(?:^|\n)(\d+)\.\s*\*\*(.+?)\*\*[:\s]*([\s\S]*?)(?=\n\d+\.\s*\*\*|$)/gi,
  ];
  
  for (const pattern of stepPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(cleanedContent)) !== null) {
      const stepNum = parseInt(match[1]);
      const title = match[2].replace(/\*\*/g, '').trim();
      const stepContent = match[3].trim();
      
      // Avoid duplicates
      if (!result.steps.find(s => s.stepNumber === stepNum)) {
        result.steps.push({
          stepNumber: stepNum,
          title,
          content: stepContent,
        });
      }
    }
    if (result.steps.length > 0) break;
  }
  
  // Sort steps by number
  result.steps.sort((a, b) => a.stepNumber - b.stepNumber);
  
  // Extract final answer
  const answerPatterns = [
    /(?:^|\n)(?:###?\s*)?\*\*(?:Final\s*)?(?:Answer|Result|Conclusion)\*\*[:\s]*([\s\S]*?)$/i,
    /(?:^|\n)###?\s*(?:Final\s*)?(?:Answer|Result|Conclusion)[:\s]*([\s\S]*?)$/i,
    /(?:^|\n)(?:Therefore|Thus|Hence|So)[,:\s]*([\s\S]*?)$/i,
  ];
  
  for (const pattern of answerPatterns) {
    const match = cleanedContent.match(pattern);
    if (match) {
      result.finalAnswer = match[1].trim();
      break;
    }
  }
  
  return result;
}

const StepCard = ({ step, index, isExpanded, onToggle }: { 
  step: SolutionStep; 
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const colorClass = stepColors[index % stepColors.length];
  const detailedExplanation = useMemo(() => generateDetailedExplanation(step), [step]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      <div className="bg-card/80 dark:bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Step Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 dark:bg-muted/20 border-b border-border/30">
          <div className="flex items-center gap-3">
            <span className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-semibold",
              colorClass
            )}>
              {step.stepNumber}
            </span>
            <h3 className="font-semibold text-foreground tracking-tight">
              {step.title}
            </h3>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
        
        {/* Step Content */}
        <div className="p-4 md:p-5">
          <div className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            "prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-2",
            "prose-strong:text-foreground prose-strong:font-semibold",
            "[&_.katex]:text-[1.05em] [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto",
            "[&_.katex-display]:text-left [&_.katex]:text-foreground",
            "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono",
            "prose-code:before:content-none prose-code:after:content-none"
          )}>
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {step.content}
            </ReactMarkdown>
          </div>
          
          {/* Detailed Solution Toggle */}
          <div className="mt-4 pt-3 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn(
                "gap-2 text-muted-foreground hover:text-primary transition-colors",
                isExpanded && "text-primary"
              )}
            >
              <Lightbulb className="w-4 h-4" />
              Detailed Explanation
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-200",
                isExpanded && "rotate-180"
              )} />
            </Button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
                    <div className={cn(
                      "prose prose-sm dark:prose-invert max-w-none",
                      "prose-p:text-foreground/85 prose-p:leading-relaxed prose-p:my-2",
                      "prose-strong:text-primary prose-strong:font-semibold",
                      "prose-li:text-foreground/85",
                      "[&_.katex]:text-foreground"
                    )}>
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {detailedExplanation}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const InfoSection = ({ label, content, colorClass }: { label: string; content: string; colorClass: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex gap-3 items-start"
  >
    <span className={cn(
      "px-2 py-0.5 rounded-md text-xs font-semibold text-white shrink-0 mt-0.5",
      colorClass
    )}>
      {label}
    </span>
    <div className={cn(
      "prose prose-sm dark:prose-invert max-w-none flex-1",
      "[&_.katex]:text-[1em] [&_.katex]:text-foreground",
      "prose-p:my-0 prose-p:text-foreground/90"
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  </motion.div>
);

export const StepBySolutionRenderer = ({ content, className }: StepBySolutionRendererProps) => {
  const { resolvedTheme } = useTheme();
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  
  const parsed = useMemo(() => parseSolution(content), [content]);
  const hasStructuredContent = parsed.steps.length > 0 || parsed.problem || parsed.given || parsed.find;
  
  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };
  
  // If we couldn't parse structured steps, fall back to enhanced markdown
  if (!hasStructuredContent) {
    return (
      <div className={cn(
        "prose prose-sm md:prose-base dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
        "prose-p:text-foreground/90 prose-p:leading-relaxed",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "[&_.katex]:text-[1.05em] [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto",
        "[&_.katex]:text-foreground",
        "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono",
        "prose-code:before:content-none prose-code:after:content-none",
        className
      )}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Problem Statement */}
      {parsed.problem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/60 dark:bg-card/40 rounded-xl border border-border/50 p-4 md:p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📋</span>
            <h3 className="font-semibold text-foreground">Problem</h3>
          </div>
          <div className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            "[&_.katex]:text-foreground prose-p:text-foreground/90 prose-p:my-0"
          )}>
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {parsed.problem}
            </ReactMarkdown>
          </div>
        </motion.div>
      )}
      
      {/* Given & Find */}
      {(parsed.given || parsed.find) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/60 dark:bg-card/40 rounded-xl border border-border/50 p-4 md:p-5 space-y-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📝</span>
            <h3 className="font-semibold text-foreground">Quick Solution</h3>
          </div>
          {parsed.given && (
            <InfoSection label="Given" content={parsed.given} colorClass="bg-blue-500" />
          )}
          {parsed.find && (
            <InfoSection label="Find" content={parsed.find} colorClass="bg-emerald-500" />
          )}
        </motion.div>
      )}
      
      {/* Steps */}
      {parsed.steps.length > 0 && (
        <div className="space-y-3">
          {parsed.steps.map((step, index) => (
            <StepCard 
              key={step.stepNumber} 
              step={step} 
              index={index}
              isExpanded={expandedSteps.has(step.stepNumber)}
              onToggle={() => toggleStep(step.stepNumber)}
            />
          ))}
        </div>
      )}
      
      {/* Final Answer */}
      {parsed.finalAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: parsed.steps.length * 0.1 }}
          className="relative"
        >
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 rounded-xl border border-primary/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  ✓
                </span>
                <h3 className="font-semibold text-primary tracking-tight">
                  Final Answer
                </h3>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-primary/10 text-primary/70 hover:text-primary transition-colors">
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 md:p-5">
              <div className={cn(
                "prose prose-sm dark:prose-invert max-w-none",
                "[&_.katex]:text-[1.1em] [&_.katex-display]:my-2",
                "[&_.katex]:text-foreground",
                "prose-p:text-foreground/90 prose-p:my-0"
              )}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {parsed.finalAnswer}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
