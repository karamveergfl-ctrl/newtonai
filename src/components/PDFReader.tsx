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

      {showSearchPrompt && (
        <Card className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 p-4 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm animate-fade-in max-w-md">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Selected text:</p>
                <p className="text-sm font-medium line-clamp-2">{selectedText}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-6 w-6"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              onClick={handleSearchClick}
              className="w-full"
              size="sm"
            >
              Find Videos About This
            </Button>
          </div>
        </Card>
      )}

      <div className="text-center text-sm text-muted-foreground">
        💡 Select any text in the PDF (minimum 5 characters) to find related videos
      </div>
    </div>
  );
};
