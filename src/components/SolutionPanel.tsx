import { Button } from "@/components/ui/button";
import { X, Image as ImageIcon, Loader2, Search, BookOpen, Volume2, VolumeX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { SolutionChatInput } from "./SolutionChatInput";
import { useState, useRef, useEffect, useMemo } from "react";

// Component to render SVG diagrams from markdown content
const SvgDiagram = ({ svgContent }: { svgContent: string }) => {
  return (
    <div 
      className="my-6 flex justify-center rounded-lg overflow-hidden border border-border bg-muted/30 p-4"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
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
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    speechSynthesis.current = window.speechSynthesis;
    return () => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
    };
  }, []);

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

  // Extract similar problem text for "Solve This" button
  const extractSimilarProblem = (): string | null => {
    const match = content.match(/## 🎯 Practice Problem\s*\n([\s\S]*?)(?=\n---|\n## |$)/);
    if (match) {
      return match[1].trim();
    }
    return null;
  };

  const similarProblem = extractSimilarProblem();

  return (
    <div className="h-full flex flex-col bg-card border-l animate-fade-in">
      <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
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
        <div className="p-6 space-y-6">
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
          
          {/* LaTeX-rendered Solution with improved spacing */}
          <div className="prose prose-sm dark:prose-invert max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-foreground prose-p:leading-loose prose-p:mb-4
            prose-strong:text-primary prose-strong:font-semibold
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-4
            prose-ul:my-4 prose-li:my-2 prose-li:leading-relaxed
            prose-ol:my-4
            prose-hr:my-8 prose-hr:border-border
            [&_.katex-display]:my-6 [&_.katex-display]:py-2
            [&_.katex]:text-base
          ">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children, ...props }) => {
                  // Check if children contains SVG placeholder
                  const childText = typeof children === 'string' ? children : '';
                  const svgMatch = childText.match(/__SVG_DIAGRAM_(\d+)__/);
                  if (svgMatch) {
                    const index = parseInt(svgMatch[1]);
                    if (svgDiagrams[index]) {
                      return <SvgDiagram svgContent={svgDiagrams[index]} />;
                    }
                  }
                  return <p className="mb-4 leading-loose" {...props}>{children}</p>;
                },
                h2: ({ children, ...props }) => (
                  <h2 className="text-xl font-bold mt-8 mb-4 border-b border-border pb-2 text-foreground" {...props}>{children}</h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground" {...props}>{children}</h3>
                ),
                strong: ({ children, ...props }) => (
                  <strong className="font-semibold text-primary" {...props}>{children}</strong>
                ),
                hr: () => (
                  <hr className="my-8 border-border" />
                ),
                li: ({ children, ...props }) => (
                  <li className="my-2 leading-relaxed" {...props}>{children}</li>
                ),
                // Handle code blocks that might contain SVG
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
              {processedContent}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-0.5" />
            )}
          </div>

          {/* Action Buttons */}
          {!isStreaming && content && (
            <div className="flex flex-col gap-3 pt-4">
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