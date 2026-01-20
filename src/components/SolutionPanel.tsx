import { Button } from "@/components/ui/button";
import { X, Image as ImageIcon, Loader2, Search, BookOpen, Volume2, VolumeX, HelpCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { SolutionChatInput } from "./SolutionChatInput";
import { useState, useRef, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";

// Component to render SVG diagrams from markdown content
const SvgDiagram = ({ svgContent }: { svgContent: string }) => {
  const sanitizedSvg = DOMPurify.sanitize(svgContent, {
    ALLOWED_TAGS: ['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text', 'g', 'defs', 'use', 'marker', 'ellipse', 'tspan'],
    ALLOWED_ATTR: ['viewBox', 'width', 'height', 'xmlns', 'd', 'fill', 'stroke', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'transform', 'class', 'style', 'id', 'markerWidth', 'markerHeight', 'refX', 'refY', 'orient', 'points', 'marker-end', 'font-size', 'font-weight', 'text-anchor', 'stroke-width', 'rx', 'ry']
  });
  
  return (
    <div 
      className="my-6 flex justify-center rounded-lg overflow-hidden border border-border bg-muted/30 p-4"
      dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
    />
  );
};

interface SolutionStep {
  stepNumber: number;
  title: string;
  content: string;
}

// Parse solution content into structured steps
const parseSolutionSteps = (content: string): { preamble: string; steps: SolutionStep[]; finalAnswer: string } => {
  const lines = content.split('\n');
  const steps: SolutionStep[] = [];
  let preamble = '';
  let finalAnswer = '';
  let currentStep: SolutionStep | null = null;
  let currentContent: string[] = [];
  let stepNumber = 0;
  let inFinalAnswer = false;
  let foundFirstStep = false;

  for (const line of lines) {
    // Check for step headers (### Step N: or ## Step N: or numbered patterns)
    const stepMatch = line.match(/^#{2,3}\s*(?:Step\s*)?(\d+)[:.]\s*(.+)/i) ||
                     line.match(/^\*\*(?:Step\s*)?(\d+)[:.]\s*(.+)\*\*/i);
    
    // Check for section headers that should be steps
    const sectionMatch = line.match(/^#{2,3}\s*(.+)/);
    
    // Check for final answer
    if (line.match(/final\s*answer/i) || line.match(/^#{2,3}\s*✅/)) {
      inFinalAnswer = true;
      if (currentStep) {
        currentStep.content = currentContent.join('\n').trim();
        steps.push(currentStep);
        currentStep = null;
        currentContent = [];
      }
      stepNumber++;
      currentStep = {
        stepNumber,
        title: "Final Answer",
        content: ""
      };
      foundFirstStep = true;
      continue;
    }

    if (stepMatch) {
      // Save previous step
      if (currentStep) {
        currentStep.content = currentContent.join('\n').trim();
        steps.push(currentStep);
      }
      
      stepNumber++;
      currentStep = {
        stepNumber,
        title: stepMatch[2].replace(/\*\*/g, '').trim(),
        content: ""
      };
      currentContent = [];
      foundFirstStep = true;
      inFinalAnswer = false;
    } else if (sectionMatch && !inFinalAnswer && foundFirstStep) {
      // Treat major sections as steps
      const title = sectionMatch[1].replace(/[📊📚📝💡✅🎯]/g, '').trim();
      if (title && !title.match(/^(given|find|solution)/i)) {
        if (currentStep) {
          currentStep.content = currentContent.join('\n').trim();
          steps.push(currentStep);
        }
        stepNumber++;
        currentStep = {
          stepNumber,
          title,
          content: ""
        };
        currentContent = [];
      } else if (currentStep) {
        currentContent.push(line);
      }
    } else if (sectionMatch && !foundFirstStep) {
      // First section becomes step 1
      const title = sectionMatch[1].replace(/[📊📚📝💡✅🎯]/g, '').trim();
      stepNumber++;
      currentStep = {
        stepNumber,
        title: title || "Understanding the Problem",
        content: ""
      };
      currentContent = [];
      foundFirstStep = true;
    } else if (currentStep) {
      currentContent.push(line);
    } else {
      preamble += line + '\n';
    }
  }

  // Save last step
  if (currentStep) {
    currentStep.content = currentContent.join('\n').trim();
    steps.push(currentStep);
  }

  // If no steps found, create a single step with all content
  if (steps.length === 0) {
    steps.push({
      stepNumber: 1,
      title: "Solution",
      content: content
    });
  }

  return { preamble: preamble.trim(), steps, finalAnswer };
};

interface SolutionPanelProps {
  content: string;
  isQuestion: boolean;
  onClose: () => void;
  capturedImage?: string;
  isStreaming?: boolean;
  onFollowUpQuestion?: (question: string) => void;
  isAnswering?: boolean;
  onFindSimilar?: () => void;
  isFindingSimilar?: boolean;
  onGetDetailedSolution?: () => void;
  isGettingDetailed?: boolean;
  onSolveSimilar?: (problemText: string) => void;
  isSolvingSimilar?: boolean;
}

export const SolutionPanel = ({ 
  content, 
  isQuestion, 
  onClose, 
  capturedImage, 
  isStreaming,
  onFollowUpQuestion,
  isAnswering,
  onFindSimilar,
  isFindingSimilar,
  onGetDetailedSolution,
  isGettingDetailed,
  onSolveSimilar,
  isSolvingSimilar
}: SolutionPanelProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [askingAboutStep, setAskingAboutStep] = useState<number | null>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    speechSynthesis.current = window.speechSynthesis;
    return () => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
    };
  }, []);

  // Parse content into steps
  const { preamble, steps } = useMemo(() => {
    return parseSolutionSteps(content);
  }, [content]);

  // Extract SVG diagrams from content and return processed content
  const { processedContent, svgDiagrams } = useMemo(() => {
    const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
    const diagrams: string[] = [];
    let processed = content;
    
    // Find all SVG elements and replace with placeholders
    let match;
    let index = 0;
    while ((match = svgRegex.exec(content)) !== null) {
      diagrams.push(match[0]);
      processed = processed.replace(match[0], `__SVG_DIAGRAM_${index}__`);
      index++;
    }
    
    return { processedContent: processed, svgDiagrams: diagrams };
  }, [content]);

  const extractTextForSpeech = (markdown: string): string => {
    // Remove SVG content first
    let text = markdown.replace(/<svg[\s\S]*?<\/svg>/gi, ' [diagram shown] ');
    // Remove LaTeX display math
    text = text.replace(/\$\$[^$]+\$\$/g, ' [equation] ');
    // Remove LaTeX inline math but try to read simple values
    text = text.replace(/\$([^$]+)\$/g, (_, content) => {
      // Extract numbers and units
      const simplified = content
        .replace(/\\text\{([^}]+)\}/g, '$1')
        .replace(/\\,/g, ' ')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
        .replace(/\\boxed\{([^}]+)\}/g, 'Answer: $1')
        .replace(/[\\{}]/g, '')
        .replace(/\^(\d+)/g, ' to the power $1')
        .replace(/_(\d+)/g, ' sub $1');
      return simplified;
    });
    // Remove markdown formatting
    text = text.replace(/#{1,6}\s/g, '');
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/`[^`]+`/g, '');
    text = text.replace(/```[\s\S]*?```/g, '');
    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/---+/g, '');
    return text.trim();
  };

  const handleVoiceReadout = () => {
    if (!speechSynthesis.current) return;

    if (isSpeaking) {
      speechSynthesis.current.cancel();
      setIsSpeaking(false);
      setCurrentUtterance(null);
      return;
    }

    const textToRead = extractTextForSpeech(content);
    if (!textToRead) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    // Try to get a good English voice
    const voices = speechSynthesis.current.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) 
      || voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentUtterance(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentUtterance(null);
    };

    setCurrentUtterance(utterance);
    setIsSpeaking(true);
    speechSynthesis.current.speak(utterance);
  };

  // Handle asking for explanation of a step
  const handleAskAboutStep = (step: SolutionStep) => {
    setAskingAboutStep(step.stepNumber);
    if (onFollowUpQuestion) {
      const question = `Please explain Step ${step.stepNumber}: "${step.title}" in more detail and in simpler terms. Break it down so it's easier to understand.`;
      onFollowUpQuestion(question);
    }
  };

  // Extract similar problem text for "Solve This" button
  const extractSimilarProblem = (): string | null => {
    const match = content.match(/## 🎯 Practice Problem\s*\n([\s\S]*?)(?=\n---|\n## |$)/);
    if (match) {
      return match[1].trim();
    }
    return null;
  };

  const similarProblem = extractSimilarProblem();

  // Render step content with markdown
  const renderStepContent = (stepContent: string) => {
    // Process SVG diagrams in step content
    let processedStepContent = stepContent;
    svgDiagrams.forEach((svg, index) => {
      if (stepContent.includes(svg)) {
        processedStepContent = processedStepContent.replace(svg, `__SVG_DIAGRAM_${index}__`);
      }
    });

    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children, ...props }) => {
            const childText = typeof children === 'string' ? children : '';
            const svgMatch = childText.match(/__SVG_DIAGRAM_(\d+)__/);
            if (svgMatch) {
              const index = parseInt(svgMatch[1]);
              if (svgDiagrams[index]) {
                return <SvgDiagram svgContent={svgDiagrams[index]} />;
              }
            }
            return <p className="mb-3 leading-relaxed text-foreground/90" {...props}>{children}</p>;
          },
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-primary" {...props}>{children}</strong>
          ),
          li: ({ children, ...props }) => (
            <li className="my-1.5 leading-relaxed" {...props}>{children}</li>
          ),
          code: ({ children, className, ...props }) => {
            const childText = typeof children === 'string' ? children : '';
            const svgMatch = childText.match(/__SVG_DIAGRAM_(\d+)__/);
            if (svgMatch) {
              const index = parseInt(svgMatch[1]);
              if (svgDiagrams[index]) {
                return <SvgDiagram svgContent={svgDiagrams[index]} />;
              }
            }
            return <code className={className} {...props}>{children}</code>;
          },
        }}
      >
        {processedStepContent}
      </ReactMarkdown>
    );
  };

  return (
    <div className="h-full flex flex-col bg-card border-l animate-fade-in">
      <div className="sticky top-0 bg-card border-b border-border px-3 md:px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">
            {isQuestion ? "📝 Detailed Solution" : "💡 Topic Overview"}
          </h3>
          {(isStreaming || isAnswering) && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{isAnswering ? "Answering..." : "Solving..."}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Voice Readout Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceReadout}
            className="h-8 w-8"
            disabled={isStreaming || !content}
            title={isSpeaking ? "Stop reading" : "Read aloud"}
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4 text-primary" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-4">
          {/* Captured Screenshot Display */}
          {capturedImage && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ImageIcon className="w-4 h-4" />
                <span>Captured Problem</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                <img 
                  src={capturedImage} 
                  alt="Captured problem" 
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          )}

          {/* Preamble/Answer Section */}
          {preamble && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Answer</h4>
              <div className="rounded-lg bg-muted/50 p-4 border border-border">
                <div className="prose prose-sm dark:prose-invert max-w-none [&_.katex]:text-base">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {preamble}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
          
          {/* Step-by-Step Solution Cards */}
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.stepNumber} className="space-y-2">
                {/* Step Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Step Number Badge */}
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                      {step.stepNumber}
                    </div>
                    {/* Step Title */}
                    <h4 className="font-semibold text-foreground">{step.title}</h4>
                  </div>
                  {/* Explanation Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleAskAboutStep(step)}
                    className="h-8 w-8 shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                    disabled={isAnswering}
                    title="Explain this step in more detail"
                  >
                    {askingAboutStep === step.stepNumber && isAnswering ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <HelpCircle className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                {/* Step Content Card */}
                <div className="ml-6 md:ml-10 rounded-lg bg-muted/40 p-3 md:p-4 border border-border/50">
                  <div className="prose prose-sm dark:prose-invert max-w-none
                    [&_.katex-display]:my-4 [&_.katex-display]:py-1
                    [&_.katex]:text-base
                  ">
                    {renderStepContent(step.content)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating solution...</span>
            </div>
          )}

          {/* Action Buttons */}
          {!isStreaming && content && (
            <div className="flex flex-col gap-2 sm:gap-3 pt-4">
              {/* Solve Similar Problem Button */}
              {similarProblem && onSolveSimilar && (
                <Button
                  onClick={() => onSolveSimilar(similarProblem)}
                  variant="default"
                  className="w-full gap-2"
                  disabled={isSolvingSimilar}
                >
                  {isSolvingSimilar ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Solving practice problem...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      🎯 Solve This Practice Problem
                    </>
                  )}
                </Button>
              )}

              {/* Detailed Solution Button */}
              {onGetDetailedSolution && (
                <Button
                  onClick={onGetDetailedSolution}
                  variant="default"
                  className="w-full"
                  disabled={isGettingDetailed}
                >
                  {isGettingDetailed ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting detailed solution...
                    </>
                  ) : (
                    "📖 Show Detailed Solution"
                  )}
                </Button>
              )}
              
              {/* Find Similar Questions Button */}
              {onFindSimilar && (
                <Button
                  onClick={onFindSimilar}
                  variant="outline"
                  className="w-full"
                  disabled={isFindingSimilar}
                >
                  {isFindingSimilar ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Finding similar problems...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Find Similar Questions to Practice
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Chat Input for Follow-up Questions */}
      {onFollowUpQuestion && !isStreaming && (
        <SolutionChatInput
          onSendMessage={onFollowUpQuestion}
          isLoading={isAnswering}
          placeholder="Ask a follow-up question..."
        />
      )}
    </div>
  );
};
