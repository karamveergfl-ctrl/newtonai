import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2, Maximize, Minimize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  pdfUrl: string;
  onTextSelect: (selectedText: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const PDFReader = ({ pdfUrl, onTextSelect, isFullscreen, onToggleFullscreen }: PDFReaderProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 10) {
        setIsSearching(true);
        onTextSelect(selectedText);
        setTimeout(() => setIsSearching(false), 1000);
        
        toast({
          title: "Finding videos...",
          description: `Searching for: "${selectedText.slice(0, 50)}..."`,
        });
      }
    };

    document.addEventListener("mouseup", handleTextSelection);
    return () => document.removeEventListener("mouseup", handleTextSelection);
  }, [onTextSelect, toast]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
              className="gap-2"
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-4 h-4" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-center bg-muted/20 rounded-lg overflow-auto max-h-[70vh]">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="max-w-full"
            />
          </Document>
        </div>
      </Card>

      {isSearching && (
        <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Analyzing selection...</span>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        💡 Select any text in the PDF to find related animation videos
      </div>
    </div>
  );
};
