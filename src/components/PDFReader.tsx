import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2, Camera, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSearchPrompt } from "@/components/MobileSearchPrompt";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  pdfUrl: string;
  onTextSelect: (selectedText: string) => void;
  onImageCapture: (imageData: string) => void;
  onPdfTextExtracted?: (text: string) => void;
  triggerScreenshot?: boolean;
  onScreenshotTriggered?: () => void;
}

export const PDFReader = ({ pdfUrl, onTextSelect, onImageCapture, onPdfTextExtracted, triggerScreenshot, onScreenshotTriggered }: PDFReaderProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [selectedText, setSelectedText] = useState<string>("");
  const [showSearchPrompt, setShowSearchPrompt] = useState(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotStart, setScreenshotStart] = useState<{ x: number; y: number } | null>(null);
  const [screenshotEnd, setScreenshotEnd] = useState<{ x: number; y: number } | null>(null);
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Handle text selection
  useEffect(() => {
    const handleTextSelection = () => {
      if (isScreenshotMode || isCapturing) return;
      
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length >= 5) {
        setSelectedText(text);
        if (isMobile) {
          // On mobile, wait for long-press to trigger
        } else {
          setShowSearchPrompt(true);
        }
      } else if (!text) {
        if (!isMobile) {
          setShowSearchPrompt(false);
        }
        setSelectedText("");
      }
    };

    document.addEventListener("mouseup", handleTextSelection);
    document.addEventListener("touchend", handleTextSelection);
    return () => {
      document.removeEventListener("mouseup", handleTextSelection);
      document.removeEventListener("touchend", handleTextSelection);
    };
  }, [isScreenshotMode, isCapturing, isMobile]);

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

  // Handle external screenshot trigger
  useEffect(() => {
    if (triggerScreenshot) {
      activateScreenshotMode();
      onScreenshotTriggered?.();
    }
  }, [triggerScreenshot, onScreenshotTriggered]);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isScreenshotMode) return;
    
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true);
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length >= 3) {
        setSelectedText(text);
        setShowMobilePrompt(true);
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
      setIsLongPressing(false);
    }, 600);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isScreenshotMode) return;
    
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Cancel long press if moved too much
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setIsLongPressing(false);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;
    setIsLongPressing(false);
  };

  const activateScreenshotMode = () => {
    setIsScreenshotMode(true);
    setIsCapturing(false);
    setScreenshotStart(null);
    setScreenshotEnd(null);
    toast({
      title: "Screenshot Mode Active",
      description: isMobile ? "Tap and drag to select an area" : "Click and drag to select an area to capture",
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

  // Touch handlers for screenshot mode
  const handleScreenshotTouchStart = (e: React.TouchEvent) => {
    if (!isScreenshotMode) return;
    
    const touch = e.touches[0];
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    setIsCapturing(true);
    setScreenshotStart({ 
      x: touch.clientX - rect.left + container.scrollLeft, 
      y: touch.clientY - rect.top + container.scrollTop 
    });
    setScreenshotEnd({ 
      x: touch.clientX - rect.left + container.scrollLeft, 
      y: touch.clientY - rect.top + container.scrollTop 
    });
  };

  const handleScreenshotTouchMove = (e: React.TouchEvent) => {
    if (!isScreenshotMode || !isCapturing) return;
    
    const touch = e.touches[0];
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    setScreenshotEnd({ 
      x: touch.clientX - rect.left + container.scrollLeft, 
      y: touch.clientY - rect.top + container.scrollTop 
    });
  };

  const handleScreenshotTouchEnd = async () => {
    if (!isScreenshotMode || !isCapturing || !screenshotStart || !screenshotEnd) return;
    await captureScreenshot();
  };

  const captureScreenshot = async () => {
    if (!screenshotStart || !screenshotEnd) return;
    
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

    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const canvasRect = pdfCanvas.getBoundingClientRect();
    
    const canvasOffsetX = canvasRect.left - containerRect.left + container.scrollLeft;
    const canvasOffsetY = canvasRect.top - containerRect.top + container.scrollTop;
    
    const x = Math.min(screenshotStart.x, screenshotEnd.x) - canvasOffsetX;
    const y = Math.min(screenshotStart.y, screenshotEnd.y) - canvasOffsetY;
    
    const scaleX = pdfCanvas.width / canvasRect.width;
    const scaleY = pdfCanvas.height / canvasRect.height;
    
    const cropCanvas = document.createElement('canvas');
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) {
      cancelScreenshotMode();
      return;
    }

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

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!isScreenshotMode || !isCapturing || !screenshotStart || !screenshotEnd) return;
    e.preventDefault();
    await captureScreenshot();
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

  const handleMobileSearch = (text: string) => {
    onTextSelect(text);
    toast({
      title: "Finding videos...",
      description: `Searching for: "${text.slice(0, 50)}..."`,
    });
  };

  const handleDismiss = () => {
    setShowSearchPrompt(false);
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

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

  // Swipe navigation for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
  const handleSwipeStart = (e: React.TouchEvent) => {
    if (isScreenshotMode) return;
    setTouchStartX(e.touches[0].clientX);
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (isScreenshotMode || touchStartX === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    // Swipe threshold of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0 && pageNumber < numPages) {
        setPageNumber(prev => prev + 1);
      } else if (diff < 0 && pageNumber > 1) {
        setPageNumber(prev => prev - 1);
      }
    }
    setTouchStartX(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(200, prev + 5));
  const handleZoomOut = () => setZoom(prev => Math.max(25, prev - 5));
  const handleFitScreen = () => setZoom(100);

  const getPageWidth = () => {
    if (typeof window === 'undefined') return 800;
    const baseWidth = Math.min(window.innerWidth * 0.95, 1200);
    return baseWidth * (zoom / 100);
  };

  return (
    <div className="h-full flex flex-col relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
      {/* Previous Page Button - Top Left */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
        disabled={pageNumber <= 1}
        className="absolute top-2 left-2 z-40 h-10 w-10 bg-background/80 backdrop-blur-sm shadow-md hover:bg-background"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      {/* Next Page Button - Top Right */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
        disabled={pageNumber >= numPages}
        className="absolute top-2 right-2 z-40 h-10 w-10 bg-background/80 backdrop-blur-sm shadow-md hover:bg-background"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Center Top Controls - Page info, Zoom, Screenshot */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40">
        <Card className="p-1.5 border-0 shadow-lg bg-background/90 backdrop-blur-md">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground px-2">
              {pageNumber} / {numPages}
            </span>
            
            <div className="h-4 w-px bg-border" />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 25}
              className="h-7 w-7"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            
            <span className="text-xs text-muted-foreground min-w-[40px] text-center">
              {zoom}%
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="h-7 w-7"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFitScreen}
              className="h-7 w-7"
              title="Fit to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
            
            <div className="h-4 w-px bg-border" />
            
            {!isScreenshotMode ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={activateScreenshotMode}
                className="h-7 w-7"
                title="Screenshot"
              >
                <Camera className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="icon"
                onClick={cancelScreenshotMode}
                className="h-7 w-7"
                title="Cancel Screenshot"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* PDF Display */}
      <div 
        ref={containerRef}
        className={`flex-1 flex justify-center overflow-auto scrollbar-thin pdf-container relative pt-14 ${
          isScreenshotMode ? 'cursor-crosshair select-none' : ''
        } ${isLongPressing ? 'bg-primary/5' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={isScreenshotMode ? handleScreenshotTouchStart : handleTouchStart}
        onTouchMove={isScreenshotMode ? handleScreenshotTouchMove : handleTouchMove}
        onTouchEnd={isScreenshotMode ? handleScreenshotTouchEnd : handleTouchEnd}
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

        {/* Long press indicator */}
        {isLongPressing && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        )}
        
        <div
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
          className="w-full flex justify-center"
        >
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
              className="mx-auto shadow-lg"
              width={getPageWidth()}
            />
          </Document>
        </div>
      </div>

      {/* Screenshot mode instructions */}
      {isScreenshotMode && !isCapturing && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-pulse text-sm">
          {isMobile ? "Tap and drag to select" : "Click and drag to select area"}
        </div>
      )}

      {/* Desktop search prompt */}
      {!isMobile && showSearchPrompt && !isScreenshotMode && (
        <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 p-3 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm animate-fade-in max-w-sm w-11/12 md:max-w-md">
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

      {/* Mobile search prompt (bottom drawer) */}
      <MobileSearchPrompt
        open={showMobilePrompt}
        onOpenChange={setShowMobilePrompt}
        selectedText={selectedText}
        onSearch={handleMobileSearch}
      />
    </div>
  );
};
