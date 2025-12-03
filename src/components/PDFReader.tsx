import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2, Camera, X } from "lucide-react";
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
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotStart, setScreenshotStart] = useState<{ x: number; y: number } | null>(null);
  const [screenshotEnd, setScreenshotEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle text selection
  useEffect(() => {
    const handleTextSelection = () => {
      if (isScreenshotMode || isCapturing) return;
      
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
  }, [isScreenshotMode, isCapturing]);

  // Extract text from PDF for chat feature
  useEffect(() => {
    if (!pdfUrl || !onPdfTextExtracted) return;

    const extractText = async () => {
      try {
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        let fullText = "";
        
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

  const activateScreenshotMode = () => {
    setIsScreenshotMode(true);
    setIsCapturing(false);
    setScreenshotStart(null);
    setScreenshotEnd(null);
    toast({
      title: "Screenshot Mode Active",
      description: "Click and drag to select an area to capture",
    });
  };

  const cancelScreenshotMode = () => {
    setIsScreenshotMode(false);
    setIsCapturing(false);
    setScreenshotStart(null);
    setScreenshotEnd(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isScreenshotMode) return;
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;
    
    setIsCapturing(true);
    setScreenshotStart({ 
      x: e.clientX - rect.left + scrollLeft, 
      y: e.clientY - rect.top + scrollTop 
    });
    setScreenshotEnd({ 
      x: e.clientX - rect.left + scrollLeft, 
      y: e.clientY - rect.top + scrollTop 
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScreenshotMode || !isCapturing || !screenshotStart) return;
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;
    
    setScreenshotEnd({ 
      x: e.clientX - rect.left + scrollLeft, 
      y: e.clientY - rect.top + scrollTop 
    });
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!isScreenshotMode || !isCapturing || !screenshotStart || !screenshotEnd) return;
    e.preventDefault();
    
    const width = Math.abs(screenshotEnd.x - screenshotStart.x);
    const height = Math.abs(screenshotEnd.y - screenshotStart.y);
    
    // Minimum area check
    if (width < 20 || height < 20) {
      setIsCapturing(false);
      setScreenshotStart(null);
      setScreenshotEnd(null);
      toast({
        title: "Area too small",
        description: "Please select a larger area",
        variant: "destructive",
      });
      return;
    }
    
    const pdfCanvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
    if (!pdfCanvas) {
      cancelScreenshotMode();
      return;
    }

    // Get the container and canvas positions
    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const canvasRect = pdfCanvas.getBoundingClientRect();
    
    // Calculate offset of canvas within container
    const canvasOffsetX = canvasRect.left - containerRect.left + container.scrollLeft;
    const canvasOffsetY = canvasRect.top - containerRect.top + container.scrollTop;
    
    // Adjust coordinates relative to the canvas
    const x = Math.min(screenshotStart.x, screenshotEnd.x) - canvasOffsetX;
    const y = Math.min(screenshotStart.y, screenshotEnd.y) - canvasOffsetY;
    
    // Scale factor for high DPI displays
    const scaleX = pdfCanvas.width / canvasRect.width;
    const scaleY = pdfCanvas.height / canvasRect.height;
    
    // Create a new canvas for the cropped area
    const cropCanvas = document.createElement('canvas');
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) {
      cancelScreenshotMode();
      return;
    }

    // Apply scale to get actual canvas coordinates
    const scaledX = Math.max(0, x * scaleX);
    const scaledY = Math.max(0, y * scaleY);
    const scaledWidth = Math.min(width * scaleX, pdfCanvas.width - scaledX);
    const scaledHeight = Math.min(height * scaleY, pdfCanvas.height - scaledY);

    cropCanvas.width = scaledWidth;
    cropCanvas.height = scaledHeight;
    
    ctx.drawImage(
      pdfCanvas, 
      scaledX, scaledY, scaledWidth, scaledHeight, 
      0, 0, scaledWidth, scaledHeight
    );
    
    const imageData = cropCanvas.toDataURL('image/png');
    
    cancelScreenshotMode();
    onImageCapture(imageData);
    
    toast({
      title: "Processing...",
      description: "Analyzing captured area with OCR",
    });
  };

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

  // Calculate selection box position for display (accounting for scroll)
  const getSelectionStyle = () => {
    if (!screenshotStart || !screenshotEnd || !containerRef.current) return {};
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;
    
    return {
      left: Math.min(screenshotStart.x, screenshotEnd.x) - scrollLeft,
      top: Math.min(screenshotStart.y, screenshotEnd.y) - scrollTop,
      width: Math.abs(screenshotEnd.x - screenshotStart.x),
      height: Math.abs(screenshotEnd.y - screenshotStart.y),
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Navigation bar with screenshot button */}
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
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground px-2">
                Page {pageNumber} / {numPages}
              </span>
              
              {!isScreenshotMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={activateScreenshotMode}
                  className="h-7 gap-1 text-xs"
                >
                  <Camera className="w-3 h-3" />
                  Screenshot
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={cancelScreenshotMode}
                  className="h-7 gap-1 text-xs"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </Button>
              )}
            </div>
            
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

      {/* PDF Display */}
      <div 
        ref={containerRef}
        className={`flex-1 flex justify-center overflow-auto bg-muted/10 scrollbar-thin pdf-container relative ${
          isScreenshotMode ? 'cursor-crosshair select-none' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Screenshot mode overlay */}
        {isScreenshotMode && (
          <div className="absolute inset-0 bg-primary/5 z-10 pointer-events-none" />
        )}
        
        {/* Selection rectangle */}
        {isScreenshotMode && isCapturing && screenshotStart && screenshotEnd && (
          <div
            className="absolute border-2 border-primary bg-primary/20 z-20 pointer-events-none"
            style={getSelectionStyle()}
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

      {/* Screenshot mode instructions */}
      {isScreenshotMode && !isCapturing && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-pulse">
          Click and drag to select area
        </div>
      )}

      {showSearchPrompt && !isScreenshotMode && (
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
                <X className="w-4 h-4" />
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
        💡 Select text or use Screenshot button to capture area
      </div>
    </div>
  );
};
