import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { X, Download, Loader2, Brain, BookOpen, FileText, Network } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Animate progress bar while loading
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          // Slow down as we approach 90%
          if (prev < 30) return prev + 3;
          if (prev < 60) return prev + 2;
          if (prev < 85) return prev + 0.5;
          return prev;
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      // Complete the progress bar when done
      setProgress(100);
    }
  }, [isLoading]);

  const getIcon = () => {
    switch (type) {
      case "quiz":
        return <Brain className="w-5 h-5" />;
      case "flashcards":
        return <BookOpen className="w-5 h-5" />;
      case "mindmap":
        return <Network className="w-5 h-5" />;
      case "summary":
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "quiz":
        return "Quiz";
      case "flashcards":
        return "Flashcards";
      case "mindmap":
        return "Mind Map";
      case "summary":
        return "Summary";
    }
  };

  const downloadAsPDF = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait...",
      });

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const a4Width = 210;
      const a4Height = 297;
      const margin = 10;
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const availableWidth = a4Width - (margin * 2);
      const availableHeight = a4Height - (margin * 2);
      const canvasAspect = canvas.width / canvas.height;
      
      let imgWidth = availableWidth;
      let imgHeight = availableWidth / canvasAspect;
      
      // Handle multi-page if content is too long
      if (imgHeight > availableHeight) {
        const pageHeight = (availableHeight / imgHeight) * canvas.height;
        let yOffset = 0;
        let isFirstPage = true;
        
        while (yOffset < canvas.height) {
          if (!isFirstPage) {
            pdf.addPage();
          }
          
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(pageHeight, canvas.height - yOffset);
          
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, -yOffset);
          }
          
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          const pageImgHeight = (pageCanvas.height / canvas.width) * availableWidth;
          
          pdf.addImage(pageImgData, 'PNG', margin, margin, availableWidth, pageImgHeight);
          
          yOffset += pageHeight;
          isFirstPage = false;
        }
      } else {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      }

      pdf.save(`${getTypeLabel()}_${title.slice(0, 30)}.pdf`);

      toast({
        title: "Downloaded",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Format content for LaTeX - ensure math is wrapped properly
  // Also detect if content is raw JSON (for mind maps) and format appropriately
  const formatContent = (text: string) => {
    // Check if content looks like JSON (for mind maps that failed to render visually)
    if (type === "mindmap") {
      const trimmed = text.trim();
      if (trimmed.startsWith('{') && trimmed.includes('"id"')) {
        try {
          const parsed = JSON.parse(trimmed);
          // Convert JSON mind map to readable format
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
        } catch {
          // Not valid JSON, continue with original
        }
      }
    }
    
    // Already has LaTeX markers, return as is
    if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
      return text;
    }
    return text;
  };

  // All types now render full screen
  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background flex flex-col",
      showVideoSlide && "pr-80"
    )}>
      {/* Header */}
      <div className="p-4 border-b bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h2 className="font-bold text-lg">{getTypeLabel()}</h2>
          <span className="text-sm text-muted-foreground">- {title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={downloadAsPDF}
            variant="outline"
            size="sm"
            disabled={isDownloading || isLoading}
            className="gap-2"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF
          </Button>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Loading Progress Bar */}
      {isLoading && (
        <div className="px-4 py-3 bg-card border-b">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">{loadingMessage}</p>
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-xs text-muted-foreground w-10">{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              {getIcon()}
            </div>
            <h3 className="text-xl font-semibold mb-2">Generating {getTypeLabel()}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Analyzing content and creating your personalized {getTypeLabel().toLowerCase()}...
            </p>
          </div>
        ) : (
        <div ref={contentRef} className="p-8 bg-white text-black min-h-full">
          <Card className="max-w-4xl mx-auto p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-center">{title}</h3>
            <div className="prose prose-lg max-w-none leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  // Custom styling for math blocks
                  p: ({ children }) => (
                    <p className="mb-4 text-base leading-relaxed">{children}</p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-base">{children}</li>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {formatContent(content)}
              </ReactMarkdown>
            </div>
          </Card>
        </div>
        )}
      </ScrollArea>

      {/* Video slide area */}
      {showVideoSlide && (
        <div className="fixed inset-y-0 right-0 w-80 bg-card border-l" />
      )}
    </div>
  );
};
