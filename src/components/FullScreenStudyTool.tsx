import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { X, Download, Loader2, Brain, BookOpen, FileText, Network, List, HelpCircle, Lightbulb, MessageSquare, ClipboardList, ArrowLeft } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseSummaryContent, nlmColors, typography } from "./NotebookLMStyles";

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

  const downloadAsPDF = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    try {
      toast({ title: "Generating PDF", description: "Please wait..." });

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
      
      if (imgHeight > availableHeight) {
        const pageHeight = (availableHeight / imgHeight) * canvas.height;
        let yOffset = 0;
        let isFirstPage = true;
        
        while (yOffset < canvas.height) {
          if (!isFirstPage) pdf.addPage();
          
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(pageHeight, canvas.height - yOffset);
          
          const ctx = pageCanvas.getContext('2d');
          if (ctx) ctx.drawImage(canvas, 0, -yOffset);
          
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
      toast({ title: "Downloaded", description: "PDF downloaded successfully" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const getSectionIcon = (sectionType: string) => {
    switch (sectionType) {
      case "overview": return <BookOpen className="w-5 h-5 text-white" />;
      case "keyTopics": return <List className="w-5 h-5 text-white" />;
      case "keyTerms": return <ClipboardList className="w-5 h-5 text-white" />;
      case "quickReview": return <HelpCircle className="w-5 h-5 text-white" />;
      case "essayPrompts": return <MessageSquare className="w-5 h-5 text-white" />;
      case "takeaways": return <Lightbulb className="w-5 h-5 text-white" />;
      default: return <FileText className="w-5 h-5 text-white" />;
    }
  };

  // Render NotebookLM-style study guide
  const renderStudyGuide = () => {
    const sections = parseSummaryContent(content);
    
    // If no sections parsed, fall back to regular markdown
    if (sections.length === 0) {
      return (
        <Card className="max-w-4xl mx-auto p-8 shadow-lg bg-white">
          <h3 className={cn(typography.heading1, "mb-6 text-center text-gray-900")}>{title}</h3>
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {content}
            </ReactMarkdown>
          </div>
        </Card>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Title Card */}
        <Card className="p-6 bg-white shadow-sm border border-gray-100">
          <h1 className={cn(typography.heading1, "text-center text-gray-900")}>{title}</h1>
          <p className="text-center text-gray-500 mt-2 font-sans text-sm">Study Guide • {sections.length} sections</p>
        </Card>

        {/* Section Cards */}
        {sections.map((section, index) => (
          <Card 
            key={section.type} 
            className="bg-white shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                style={{ backgroundColor: section.iconColor }}
              >
                {getSectionIcon(section.type)}
              </div>
              <h2 className={cn(typography.heading2, "text-gray-900")}>{section.title}</h2>
            </div>

            {/* Section Content */}
            <div className="p-6">
              {section.type === "keyTerms" ? (
                // Render table for key terms
                <div className="overflow-x-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      table: ({ children }) => (
                        <Table className="border rounded-lg overflow-hidden">
                          {children}
                        </Table>
                      ),
                      thead: ({ children }) => (
                        <TableHeader className="bg-gray-50">
                          {children}
                        </TableHeader>
                      ),
                      tbody: ({ children }) => <TableBody>{children}</TableBody>,
                      tr: ({ children }) => <TableRow className="border-b border-gray-100">{children}</TableRow>,
                      th: ({ children }) => (
                        <TableHead className="font-display font-semibold text-gray-700 py-3 px-4">
                          {children}
                        </TableHead>
                      ),
                      td: ({ children }) => (
                        <TableCell className="py-3 px-4 text-gray-600">
                          {children}
                        </TableCell>
                      ),
                      p: ({ children }) => <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>,
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
              ) : (
                // Regular markdown for other sections
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({ children }) => <p className="mb-3 text-gray-700 leading-relaxed font-sans">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      ul: ({ children }) => <ul className="space-y-2 my-3">{children}</ul>,
                      ol: ({ children }) => <ol className="space-y-3 my-3 list-decimal list-inside">{children}</ol>,
                      li: ({ children }) => (
                        <li className="text-gray-700 leading-relaxed pl-1">
                          <span className="text-gray-700">{children}</span>
                        </li>
                      ),
                      h3: ({ children }) => <h3 className="font-display font-medium text-gray-800 mt-4 mb-2">{children}</h3>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 pl-4 italic text-gray-600 my-3" style={{ borderColor: section.iconColor }}>
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
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
    <div className={cn("fixed inset-0 z-50 bg-gray-50 flex flex-col", showVideoSlide && "pr-80")}>
      {/* Header */}
      <div className="p-4 border-b bg-white/80 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: nlmColors.blue }}>
            <span className="text-white">{getIcon()}</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900">{getTypeLabel()}</h2>
            <span className="text-sm text-gray-500 font-sans">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={downloadAsPDF}
            variant="outline"
            size="sm"
            disabled={isDownloading || isLoading}
            className="gap-2 font-sans"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </Button>
          <Button onClick={onClose} variant="outline" size="sm" className="gap-2 font-sans text-gray-700 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" />
            Return to PDF
          </Button>
        </div>
      </div>

      {/* Loading Progress Bar */}
      {isLoading && (
        <div className="px-4 py-3 bg-white border-b">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Loader2 className="w-5 h-5 animate-spin shrink-0" style={{ color: nlmColors.blue }} />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1 font-sans text-gray-700">{loadingMessage}</p>
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-xs text-gray-500 w-10 font-sans">{Math.round(progress)}%</span>
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
            <h3 className="text-xl font-display font-semibold mb-2 text-gray-900">Generating {getTypeLabel()}</h3>
            <p className="text-gray-500 text-center max-w-md font-sans">
              Analyzing content and creating your personalized {getTypeLabel().toLowerCase()}...
            </p>
          </div>
        ) : (
          <div ref={contentRef} className="p-8 bg-gray-50 min-h-full">
            {type === "summary" ? (
              renderStudyGuide()
            ) : (
              <Card className="max-w-4xl mx-auto p-8 shadow-lg bg-white border border-gray-100">
                <h3 className={cn(typography.heading1, "mb-6 text-center text-gray-900")}>{title}</h3>
                <div className="prose prose-lg max-w-none leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({ children }) => <p className="mb-4 text-base leading-relaxed text-gray-700 font-sans">{children}</p>,
                      h1: ({ children }) => <h1 className="text-2xl font-display font-bold mt-6 mb-4 text-gray-900">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-display font-semibold mt-5 mb-3 text-gray-900">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-display font-medium mt-4 mb-2 text-gray-800">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                      li: ({ children }) => <li className="text-base text-gray-700 font-sans">{children}</li>,
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                        ) : (
                          <code className="block bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">{children}</code>
                        );
                      },
                      pre: ({ children }) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 pl-4 italic my-4 text-gray-600" style={{ borderColor: nlmColors.blue }}>
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
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

      {showVideoSlide && <div className="fixed inset-y-0 right-0 w-80 bg-white border-l" />}
    </div>
  );
};
