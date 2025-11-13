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
  onImageCapture: (imageData: string) => void;
  onPdfTextExtracted?: (text: string) => void;
}

export const PDFReader = ({ pdfUrl, onTextSelect, onImageCapture, onPdfTextExtracted }: PDFReaderProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [selectedText, setSelectedText] = useState<string>("");
  const [showSearchPrompt, setShowSearchPrompt] = useState(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [screenshotStart, setScreenshotStart] = useState<{ x: number; y: number } | null>(null);
  const [screenshotEnd, setScreenshotEnd] = useState<{ x: number; y: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleTextSelection = () => {
      if (isScreenshotMode) return; // Don't handle text selection in screenshot mode
      
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
  }, [isScreenshotMode]);

  useEffect(() => {
    const handleDoubleClick = () => {
      setIsScreenshotMode(true);
      setScreenshotStart(null);
      setScreenshotEnd(null);
      toast({
        title: "Screenshot Mode",
        description: "Click and drag to capture an area",
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!isScreenshotMode) return;
      const rect = (e.target as HTMLElement).closest('.pdf-container')?.getBoundingClientRect();
      if (rect) {
        setScreenshotStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isScreenshotMode || !screenshotStart) return;
      const rect = (e.target as HTMLElement).closest('.pdf-container')?.getBoundingClientRect();
      if (rect) {
        setScreenshotEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (!isScreenshotMode || !screenshotStart || !screenshotEnd) return;
      
      const pdfCanvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
      if (!pdfCanvas) return;

      // Create a new canvas for the cropped area
      const cropCanvas = document.createElement('canvas');
      const ctx = cropCanvas.getContext('2d');
      if (!ctx) return;

      const x = Math.min(screenshotStart.x, screenshotEnd.x);
      const y = Math.min(screenshotStart.y, screenshotEnd.y);
      const width = Math.abs(screenshotEnd.x - screenshotStart.x);
      const height = Math.abs(screenshotEnd.y - screenshotStart.y);

      cropCanvas.width = width;
      cropCanvas.height = height;
      
      ctx.drawImage(pdfCanvas, x, y, width, height, 0, 0, width, height);
      
      const imageData = cropCanvas.toDataURL('image/png');
      
      setIsScreenshotMode(false);
      setScreenshotStart(null);
      setScreenshotEnd(null);
      
      onImageCapture(imageData);
      
      toast({
        title: "Processing...",
        description: "Analyzing captured area",
      });
    };

    document.addEventListener("dblclick", handleDoubleClick);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("dblclick", handleDoubleClick);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScreenshotMode, screenshotStart, screenshotEnd, onImageCapture, toast]);

  // Extract text from PDF for chat feature
  useEffect(() => {
    if (!pdfUrl || !onPdfTextExtracted) return;

    const extractText = async () => {
      try {
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        let fullText = "";
        
        // Extract text from first 50 pages (to avoid too much data)
        const maxPages = Math.min(pdf.numPages, 50);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n\n";
        }
        
        onPdfTextExtracted(fullText);
      } catch (error) {
        console.error("Error extracting PDF text:", error);
      }
    };

    extractText();
  }, [pdfUrl, onPdfTextExtracted]);

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
      <div className="flex-1 flex justify-center overflow-auto bg-muted/10 scrollbar-thin pdf-container relative">
        {isScreenshotMode && screenshotStart && screenshotEnd && (
          <div
            className="absolute border-2 border-primary bg-primary/20 pointer-events-none z-50"
            style={{
              left: Math.min(screenshotStart.x, screenshotEnd.x),
              top: Math.min(screenshotStart.y, screenshotEnd.y),
              width: Math.abs(screenshotEnd.x - screenshotStart.x),
              height: Math.abs(screenshotEnd.y - screenshotStart.y),
            }}
          />
        )}
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
        💡 Select text (5+ chars) or double-click to screenshot area
      </div>
    </div>
  );
};
