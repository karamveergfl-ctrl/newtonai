import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2, Camera, X, ZoomIn, ZoomOut, Maximize2, Scan, Square } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { TextSelectionToolbar } from "@/components/TextSelectionToolbar";
import { MobileTextSelectionDrawer } from "@/components/MobileTextSelectionDrawer";
import { UniversalGenerationSettings } from "@/components/UniversalStudySettingsDialog";
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
  // Study tool callbacks for selected text
  onGenerateQuizFromText?: (text: string, settings?: UniversalGenerationSettings) => void;
  onGenerateFlashcardsFromText?: (text: string, settings?: UniversalGenerationSettings) => void;
  onGenerateSummaryFromText?: (text: string, settings?: UniversalGenerationSettings) => void;
  onGenerateMindMapFromText?: (text: string, settings?: UniversalGenerationSettings) => void;
  isGeneratingQuiz?: boolean;
  isGeneratingFlashcards?: boolean;
  isGeneratingSummary?: boolean;
  isGeneratingMindMap?: boolean;
  isSearching?: boolean;
}

export const PDFReader = ({ 
  pdfUrl, 
  onTextSelect, 
  onImageCapture, 
  onPdfTextExtracted, 
  triggerScreenshot, 
  onScreenshotTriggered,
  onGenerateQuizFromText,
  onGenerateFlashcardsFromText,
  onGenerateSummaryFromText,
  onGenerateMindMapFromText,
  isGeneratingQuiz = false,
  isGeneratingFlashcards = false,
  isGeneratingSummary = false,
  isGeneratingMindMap = false,
  isSearching = false,
}: PDFReaderProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [selectedText, setSelectedText] = useState<string>("");
  const [showSearchPrompt, setShowSearchPrompt] = useState(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotStart, setScreenshotStart] = useState<{ x: number; y: number } | null>(null);
  const [screenshotEnd, setScreenshotEnd] = useState<{ x: number; y: number } | null>(null);
  const [viewportStart, setViewportStart] = useState<{ x: number; y: number } | null>(null);
  const [viewportEnd, setViewportEnd] = useState<{ x: number; y: number } | null>(null);
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // ResizeObserver to track container dimensions for reliable fit-to-screen
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setContainerDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    // Initial measurement
    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    // Also listen to window resize for additional safety
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Handle text selection - scoped to only react to events inside the PDF container
  useEffect(() => {
    const handleTextSelection = (e: MouseEvent | TouchEvent) => {
      if (isScreenshotMode || isCapturing) return;
      
      const container = containerRef.current;
      const target = e.target as Node | null;
      
      // Only react to selections inside the PDF container
      // Clicks on the toolbar or dialogs should NOT clear selection
      if (container && target && !container.contains(target)) {
        return;
      }
      
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
      description: "Select area or use 'Full Page' for instant capture",
    });
  };

  const cancelScreenshotMode = () => {
    setIsScreenshotMode(false);
    setIsCapturing(false);
    setScreenshotStart(null);
    setScreenshotEnd(null);
    setViewportStart(null);
    setViewportEnd(null);
  };

  const captureFullPage = async () => {
    const pageElement = document.querySelector('.react-pdf__Page') as HTMLElement;
    if (!pageElement) {
      toast({
        title: "Error",
        description: "Could not find PDF page to capture",
        variant: "destructive",
      });
      return;
    }
    
    try {
      toast({
        title: "Capturing...",
        description: "Please wait while we capture the full page",
      });
      
      const canvas = await html2canvas(pageElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
      });
      const imageData = canvas.toDataURL('image/png');
      
      cancelScreenshotMode();
      onImageCapture(imageData);
      
      toast({
        title: "Processing...",
        description: "Analyzing captured page with OCR",
      });
    } catch (error) {
      console.error("Full page capture error:", error);
      toast({
        title: "Capture Failed",
        description: "Could not capture the page. Please try selecting an area.",
        variant: "destructive",
      });
    }
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
    
    // Store viewport coords for fixed display
    setViewportStart({ x: e.clientX, y: e.clientY });
    setViewportEnd({ x: e.clientX, y: e.clientY });
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
    
    // Update viewport coords (cursor at bottom-right)
    setViewportEnd({ x: e.clientX, y: e.clientY });
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
    
    setViewportStart({ x: touch.clientX, y: touch.clientY });
    setViewportEnd({ x: touch.clientX, y: touch.clientY });
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
    
    setViewportEnd({ x: touch.clientX, y: touch.clientY });
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

  // Fixed position style for selection rectangle (cursor at bottom-right)
  const getSelectionStyle = (): React.CSSProperties => {
    if (!viewportStart || !viewportEnd) return {};
    
    // Anchor is top-left, cursor is bottom-right
    const left = Math.min(viewportStart.x, viewportEnd.x);
    const top = Math.min(viewportStart.y, viewportEnd.y);
    const width = Math.abs(viewportEnd.x - viewportStart.x);
    const height = Math.abs(viewportEnd.y - viewportStart.y);
    
    return {
      position: 'fixed',
      left,
      top,
      width,
      height,
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
    };
  };
  
  const getSelectionDimensions = () => {
    if (!viewportStart || !viewportEnd) return null;
    const width = Math.abs(viewportEnd.x - viewportStart.x);
    const height = Math.abs(viewportEnd.y - viewportStart.y);
    return { width: Math.round(width), height: Math.round(height) };
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

  const handleZoomIn = () => {
    setIsAutoFit(false);
    setZoom(prev => Math.min(200, prev + 5));
  };
  const handleZoomOut = () => {
    setIsAutoFit(false);
    setZoom(prev => Math.max(25, prev - 5));
  };
  const handleFitScreen = () => {
    setIsAutoFit(true);
    setZoom(100);
  };

  const getPageWidth = useCallback(() => {
    if (typeof window === 'undefined') return 800;
    
    const containerWidth = containerDimensions.width || window.innerWidth * 0.9;
    
    // Auto-fit mode: WIDTH-FIRST fitting (prevents tiny thumbnail render)
    if (isAutoFit) {
      // Use 95% of container width, capped at reasonable max for readability
      // This ensures PDF is always visible and readable on initial load
      const widthFit = containerWidth * 0.95;
      return Math.min(widthFit, 1400);
    }
    
    // Manual zoom mode
    const baseWidth = Math.min(containerWidth * 0.95, 1400);
    return baseWidth * (zoom / 100);
  }, [isAutoFit, zoom, containerDimensions]);

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
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={captureFullPage}
                  className="h-7 gap-1 text-xs px-2"
                  title="Capture Full Page"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Full Page</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs px-2 pointer-events-none opacity-70"
                  title="Select Area"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Select Area</span>
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={cancelScreenshotMode}
                  className="h-7 w-7"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </>
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
        
        {/* Selection rectangle with dimmed overlay - fixed position */}
        {isScreenshotMode && isCapturing && viewportStart && viewportEnd && (
          <div
            className="border-2 border-dashed border-primary bg-transparent pointer-events-none"
            style={getSelectionStyle()}
          >
            {/* Size indicator */}
            {getSelectionDimensions() && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded whitespace-nowrap">
                {getSelectionDimensions()?.width} × {getSelectionDimensions()?.height} px
              </div>
            )}
          </div>
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
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
          <Square className="w-4 h-4" />
          {isMobile ? "Tap and drag to select area, or use Full Page" : "Drag to select area, or click 'Full Page' for instant capture"}
        </div>
      )}

      {/* Desktop text selection toolbar with study tools */}
      {!isMobile && showSearchPrompt && !isScreenshotMode && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 md:max-w-md">
          <TextSelectionToolbar
            selectedText={selectedText}
            onDismiss={handleDismiss}
            onSearchVideos={handleSearchClick}
            onGenerateQuiz={(text, settings) => onGenerateQuizFromText?.(text, settings)}
            onGenerateFlashcards={(text, settings) => onGenerateFlashcardsFromText?.(text, settings)}
            onGenerateSummary={(text, settings) => onGenerateSummaryFromText?.(text, settings)}
            onGenerateMindMap={(text, settings) => onGenerateMindMapFromText?.(text, settings)}
            isGeneratingQuiz={isGeneratingQuiz}
            isGeneratingFlashcards={isGeneratingFlashcards}
            isGeneratingSummary={isGeneratingSummary}
            isGeneratingMindMap={isGeneratingMindMap}
            isSearching={isSearching}
          />
        </div>
      )}

      {/* Mobile text selection drawer with study tools */}
      <MobileTextSelectionDrawer
        open={showMobilePrompt}
        onOpenChange={setShowMobilePrompt}
        selectedText={selectedText}
        onSearchVideos={() => handleMobileSearch(selectedText)}
        onGenerateQuiz={(text, settings) => onGenerateQuizFromText?.(text, settings)}
        onGenerateFlashcards={(text, settings) => onGenerateFlashcardsFromText?.(text, settings)}
        onGenerateSummary={(text, settings) => onGenerateSummaryFromText?.(text, settings)}
        onGenerateMindMap={(text, settings) => onGenerateMindMapFromText?.(text, settings)}
        isGeneratingQuiz={isGeneratingQuiz}
        isGeneratingFlashcards={isGeneratingFlashcards}
        isGeneratingSummary={isGeneratingSummary}
        isGeneratingMindMap={isGeneratingMindMap}
        isSearching={isSearching}
      />
    </div>
  );
};
