import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Download, Loader2, Brain, BookOpen, FileText, Network } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface FullScreenStudyToolProps {
  type: "quiz" | "flashcards" | "mindmap" | "summary";
  title: string;
  content: string;
  onClose: () => void;
  showVideoSlide?: boolean;
}

export const FullScreenStudyTool = ({
  type,
  title,
  content,
  onClose,
  showVideoSlide = false,
}: FullScreenStudyToolProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const isSummary = type === "summary";

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

  // Summary: half screen on right
  if (isSummary) {
    return (
      <div className="fixed inset-y-0 right-0 w-1/2 z-50 bg-background border-l shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b bg-card/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h2 className="font-bold text-lg">{getTypeLabel()}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={downloadAsPDF}
              variant="outline"
              size="sm"
              disabled={isDownloading}
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

        {/* Content */}
        <ScrollArea className="flex-1">
          <div ref={contentRef} className="p-6 bg-white text-black">
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Full screen for Quiz, Flashcards, Mind Map
  return (
    <div className={`fixed inset-0 z-50 bg-background flex flex-col ${showVideoSlide ? 'pr-80' : ''}`}>
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
            disabled={isDownloading}
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

      {/* Content */}
      <ScrollArea className="flex-1">
        <div ref={contentRef} className="p-8 bg-white text-black min-h-full">
          <Card className="max-w-4xl mx-auto p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-center">{title}</h3>
            <div 
              className="prose prose-lg max-w-none whitespace-pre-wrap font-mono leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </Card>
        </div>
      </ScrollArea>

      {/* Video slide area */}
      {showVideoSlide && (
        <div className="fixed inset-y-0 right-0 w-80 bg-card border-l" />
      )}
    </div>
  );
};
