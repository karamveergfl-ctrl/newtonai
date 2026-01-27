import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, BookOpen, FileText, Network, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { nlmColors, typography } from "./NotebookLMStyles";
import { StudySectionRenderer } from "./StudySectionRenderer";
import { Card } from "@/components/ui/card";

interface FullScreenStudyToolProps {
  type: "quiz" | "flashcards" | "mindmap" | "summary";
  title: string;
  content: string;
  onClose: () => void;
  showVideoSlide?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
}

export const FullScreenStudyTool = ({
  type,
  title,
  content,
  onClose,
  showVideoSlide = false,
  isLoading = false,
  loadingMessage = "Generating content...",
}: FullScreenStudyToolProps) => {
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 30) return prev + 3;
          if (prev < 60) return prev + 2;
          if (prev < 85) return prev + 0.5;
          return prev;
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isLoading]);

  const getIcon = () => {
    switch (type) {
      case "quiz": return <Brain className="w-5 h-5" />;
      case "flashcards": return <BookOpen className="w-5 h-5" />;
      case "mindmap": return <Network className="w-5 h-5" />;
      case "summary": return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "quiz": return "Quiz";
      case "flashcards": return "Flashcards";
      case "mindmap": return "Mind Map";
      case "summary": return "Study Guide";
    }
  };
  // Format content for other types
  const formatContent = (text: string) => {
    if (type === "mindmap") {
      const trimmed = text.trim();
      if (trimmed.startsWith('{') && trimmed.includes('"id"')) {
        try {
          const parsed = JSON.parse(trimmed);
          const formatNode = (node: any, depth: number = 0): string => {
            const indent = "  ".repeat(depth);
            const bullet = depth === 0 ? "# " : depth === 1 ? "## " : "- ";
            let result = `${indent}${bullet}${node.text || "Topic"}\n`;
            if (node.children && Array.isArray(node.children)) {
              result += node.children.map((child: any) => formatNode(child, depth + 1)).join("");
            }
            return result;
          };
          return formatNode(parsed);
        } catch { }
      }
    }
    return text;
  };

  return (
    <div className={cn("fixed inset-0 z-50 bg-background flex flex-col", showVideoSlide && "sm:pr-80")}>
      {/* Header */}
      <div className="p-3 md:p-4 border-b bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-10 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: nlmColors.blue }}>
            <span className="text-white">{getIcon()}</span>
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-foreground">{getTypeLabel()}</h2>
            <span className="text-sm text-muted-foreground font-sans truncate block">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={onClose} 
            variant="outline" 
            size="sm" 
            className="gap-2 font-sans flex-1 sm:flex-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Return to PDF</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </div>

      {/* Loading Progress Bar */}
      {isLoading && (
        <div className="px-4 py-3 bg-background border-b">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Loader2 className="w-5 h-5 animate-spin shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1 font-sans text-foreground">{loadingMessage}</p>
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-xs text-muted-foreground w-10 font-sans">{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
              style={{ backgroundColor: nlmColors.blue }}
            >
              <span className="text-white scale-150">{getIcon()}</span>
            </div>
            <h3 className="text-xl font-display font-semibold mb-2 text-foreground">Generating {getTypeLabel()}</h3>
            <p className="text-muted-foreground text-center max-w-md font-sans">
              Analyzing content and creating your personalized {getTypeLabel().toLowerCase()}...
            </p>
          </div>
        ) : (
          <div className="p-4 md:p-8 bg-muted/30 min-h-full">
            {type === "summary" ? (
              <div className="max-w-4xl mx-auto">
                <StudySectionRenderer content={content} type="summary" />
              </div>
            ) : (
              <Card className="max-w-4xl mx-auto p-8 shadow-lg bg-card border">
                <h3 className={cn(typography.heading1, "mb-6 text-center text-foreground")}>{title}</h3>
                <div className="prose prose-lg max-w-none leading-relaxed dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({ children }) => <p className="mb-4 text-base leading-relaxed text-foreground/80 font-sans">{children}</p>,
                      h1: ({ children }) => <h1 className="text-2xl font-display font-bold mt-6 mb-4 text-foreground">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-display font-semibold mt-5 mb-3 text-foreground">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-display font-medium mt-4 mb-2 text-foreground/90">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                      li: ({ children }) => <li className="text-base text-foreground/80 font-sans">{children}</li>,
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                        ) : (
                          <code className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">{children}</code>
                        );
                      },
                      pre: ({ children }) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 pl-4 italic my-4 text-muted-foreground" style={{ borderColor: nlmColors.blue }}>
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    }}
                  >
                    {formatContent(content)}
                  </ReactMarkdown>
                </div>
              </Card>
            )}
          </div>
        )}
      </ScrollArea>

      {showVideoSlide && <div className="fixed inset-y-0 right-0 w-80 bg-background border-l" />}
    </div>
  );
};
