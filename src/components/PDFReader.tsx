import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  pdfUrl: string;
  onTextSelect: (selectedText: string) => void;
}

export const PDFReader = ({ pdfUrl, onTextSelect }: PDFReaderProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [selectedText, setSelectedText] = useState<string>("");
  const [showSearchPrompt, setShowSearchPrompt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length >= 5) {
        setSelectedText(text);
        setShowSearchPrompt(true);
      } else if (!text) {
        setShowSearchPrompt(false);
        setSelectedText("");
      }
    };

    document.addEventListener("mouseup", handleTextSelection);
    return () => document.removeEventListener("mouseup", handleTextSelection);
  }, []);

  const handleSearchClick = () => {
    if (selectedText) {
      onTextSelect(selectedText);
      setShowSearchPrompt(false);
      
      toast({
        title: "Finding videos...",
        description: `Searching for: "${selectedText.slice(0, 50)}..."`,
      });
    }
  };

  const handleDismiss = () => {
    setShowSearchPrompt(false);
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Auto-hide navigation bar */}
      <div className="group/nav">
        <Card className="p-2 border-0 shadow-sm bg-background/80 backdrop-blur-sm opacity-0 group-hover/nav:opacity-100 transition-opacity duration-300">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
              disabled={pageNumber <= 1}
              className="h-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-xs text-muted-foreground px-2">
              Page {pageNumber} / {numPages}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
              disabled={pageNumber >= numPages}
              className="h-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* PDF Display - Optimized for space */}
      <div className="flex-1 flex justify-center overflow-auto bg-muted/10 scrollbar-thin">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
          className="w-full"
        >
          <Page 
            pageNumber={pageNumber}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="max-w-full mx-auto"
            width={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.9, 800) : 800}
          />
        </Document>
      </div>

      {showSearchPrompt && (
        <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 p-3 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm animate-fade-in max-w-sm w-11/12 md:max-w-md">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Selected:</p>
                <p className="text-sm font-medium line-clamp-2 break-words">{selectedText}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-6 w-6 shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              onClick={handleSearchClick}
              className="w-full"
              size="sm"
            >
              Find Videos
            </Button>
          </div>
        </Card>
      )}

      <div className="text-center text-xs text-muted-foreground mt-2 px-2">
        💡 Select text (5+ chars) to find videos
      </div>
    </div>
  );
};
