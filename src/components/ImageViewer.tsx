import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Eye, EyeOff, ZoomIn, ZoomOut, Camera, Scan, Square } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { TextSelectionToolbar } from "@/components/TextSelectionToolbar";
import { MobileTextSelectionDrawer } from "@/components/MobileTextSelectionDrawer";
import { UniversalGenerationSettings } from "@/components/UniversalStudySettingsDialog";

interface ImageViewerProps {
  imageUrl: string;
  imageName: string;
  ocrText?: string;
  onTextSelect: (text: string) => void;
  onImageCapture: (imageData: string) => void;
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

export const ImageViewer = ({ 
  imageUrl, 
  imageName,
  ocrText, 
  onTextSelect,
  onImageCapture,
  onGenerateQuizFromText,
  onGenerateFlashcardsFromText,
  onGenerateSummaryFromText,
  onGenerateMindMapFromText,
  isGeneratingQuiz = false,
  isGeneratingFlashcards = false,
  isGeneratingSummary = false,
  isGeneratingMindMap = false,
  isSearching = false,
}: ImageViewerProps) => {
  const [showOverlay, setShowOverlay] = useState(!!ocrText);
  const [selectedText, setSelectedText] = useState("");
  const [showSearchPrompt, setShowSearchPrompt] = useState(false);
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [screenshotStart, setScreenshotStart] = useState<{ x: number; y: number } | null>(null);
  const [screenshotEnd, setScreenshotEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleTextSelection = () => {
      if (isScreenshotMode || isCapturing) return;
      
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length >= 5) {
        setSelectedText(text);
        if (!isMobile) {
          setShowSearchPrompt(true);
        }
      }
    };

    document.addEventListener("mouseup", handleTextSelection);
    document.addEventListener("touchend", handleTextSelection);
    return () => {
      document.removeEventListener("mouseup", handleTextSelection);
      document.removeEventListener("touchend", handleTextSelection);
    };
  }, [isScreenshotMode, isCapturing, isMobile]);

  // Mobile long-press handlers
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

  const handleSearch = () => {
    if (selectedText) {
      onTextSelect(selectedText);
      setShowSearchPrompt(false);
      setSelectedText("");
      window.getSelection()?.removeAllRanges();
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

  const activateScreenshotMode = () => {
    setIsScreenshotMode(true);
    setShowOverlay(false);
    toast({
      title: "Screenshot Mode Active",
      description: "Select area or use 'Full Image' for instant capture",
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

  const captureFullImage = async () => {
    const imageElement = imageRef.current;
    if (!imageElement) {
      toast({
        title: "Error",
        description: "Could not find image to capture",
        variant: "destructive",
      });
      return;
    }
    
    try {
      toast({
        title: "Capturing...",
        description: "Please wait while we capture the full image",
      });
      
      // Create a canvas and draw the image at full resolution
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0);
      
      const imageData = canvas.toDataURL('image/png');
      
      cancelScreenshotMode();
      onImageCapture(imageData);
      
      toast({
        title: "Processing...",
        description: "Analyzing captured image with OCR",
      });
    } catch (error) {
      console.error("Full image capture error:", error);
      toast({
        title: "Capture Failed",
        description: "Could not capture the image. Please try selecting an area.",
        variant: "destructive",
      });
    }
  };

  // Store both container-relative coords (for capture) and viewport coords (for display)
  const [viewportStart, setViewportStart] = useState<{ x: number; y: number } | null>(null);
  const [viewportEnd, setViewportEnd] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isScreenshotMode) return;
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    setIsCapturing(true);
    
    // Store container-relative coords for capture
    setScreenshotStart({ 
      x: e.clientX - rect.left + container.scrollLeft, 
      y: e.clientY - rect.top + container.scrollTop 
    });
    setScreenshotEnd({ 
      x: e.clientX - rect.left + container.scrollLeft, 
      y: e.clientY - rect.top + container.scrollTop 
    });
    
    // Store viewport coords for fixed display (cursor at bottom-right)
    setViewportStart({ x: e.clientX, y: e.clientY });
    setViewportEnd({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScreenshotMode || !isCapturing) return;
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    // Update container-relative coords for capture
    setScreenshotEnd({ 
      x: e.clientX - rect.left + container.scrollLeft, 
      y: e.clientY - rect.top + container.scrollTop 
    });
    
    // Update viewport coords (cursor follows bottom-right)
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

  const captureScreenshot = async () => {
    if (!screenshotStart || !screenshotEnd) return;
    
    const width = Math.abs(screenshotEnd.x - screenshotStart.x);
    const height = Math.abs(screenshotEnd.y - screenshotStart.y);
    
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
    
    const image = imageRef.current;
    if (!image) {
      cancelScreenshotMode();
      return;
    }

    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    
    const imageOffsetX = imageRect.left - containerRect.left + container.scrollLeft;
    const imageOffsetY = imageRect.top - containerRect.top + container.scrollTop;
    
    const x = (Math.min(screenshotStart.x, screenshotEnd.x) - imageOffsetX) / zoom;
    const y = (Math.min(screenshotStart.y, screenshotEnd.y) - imageOffsetY) / zoom;
    const cropWidth = width / zoom;
    const cropHeight = height / zoom;
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      cancelScreenshotMode();
      return;
    }

    const scaledX = Math.max(0, x * scaleX);
    const scaledY = Math.max(0, y * scaleY);
    const scaledWidth = Math.min(cropWidth * scaleX, image.naturalWidth - scaledX);
    const scaledHeight = Math.min(cropHeight * scaleY, image.naturalHeight - scaledY);

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    
    ctx.drawImage(
      image, 
      scaledX, scaledY, scaledWidth, scaledHeight, 
      0, 0, scaledWidth, scaledHeight
    );
    
    const imageData = canvas.toDataURL('image/png');
    
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

  const handleScreenshotTouchEnd = async () => {
    if (!isScreenshotMode || !isCapturing || !screenshotStart || !screenshotEnd) return;
    await captureScreenshot();
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

  const textLines = ocrText?.split('\n').filter(line => line.trim()) || [];

  // Pinch-to-zoom handling
  const lastTouchDistanceRef = useRef<number | null>(null);

  const handlePinchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const scale = distance / lastTouchDistanceRef.current;
      setZoom(z => Math.min(3, Math.max(0.5, z * scale)));
      lastTouchDistanceRef.current = distance;
    }
  };

  const handlePinchEnd = () => {
    lastTouchDistanceRef.current = null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <Card className="p-2 border-0 shadow-sm bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="h-10 w-10 md:h-8 md:w-8"
            >
              <ZoomOut className="w-5 h-5 md:w-4 md:h-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              className="h-10 w-10 md:h-8 md:w-8"
            >
              <ZoomIn className="w-5 h-5 md:w-4 md:h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            {ocrText && (
              <Button
                variant={showOverlay ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOverlay(!showOverlay)}
                className="h-9 md:h-8 gap-1 text-xs px-2 md:px-3"
                disabled={isScreenshotMode}
              >
                {showOverlay ? <EyeOff className="w-4 h-4 md:w-3 md:h-3" /> : <Eye className="w-4 h-4 md:w-3 md:h-3" />}
                <span className="hidden sm:inline">{showOverlay ? "Hide" : "Show"}</span>
              </Button>
            )}
            
            {!isScreenshotMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={activateScreenshotMode}
                className="h-9 md:h-8 gap-1 text-xs px-2 md:px-3"
              >
                <Camera className="w-4 h-4 md:w-3 md:h-3" />
                <span className="hidden sm:inline">Screenshot</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={captureFullImage}
                  className="h-9 md:h-8 gap-1 text-xs px-2 md:px-3"
                  title="Capture Full Image"
                >
                  <Scan className="w-4 h-4 md:w-3 md:h-3" />
                  <span className="hidden sm:inline">Full Image</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 md:h-8 gap-1 text-xs px-2 md:px-3 pointer-events-none opacity-70"
                  title="Select Area"
                >
                  <Square className="w-4 h-4 md:w-3 md:h-3" />
                  <span className="hidden sm:inline">Select Area</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={cancelScreenshotMode}
                  className="h-9 md:h-8 gap-1 text-xs px-2 md:px-3"
                >
                  <X className="w-4 h-4 md:w-3 md:h-3" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Image with text overlay */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto bg-muted/10 p-4 relative ${
          isScreenshotMode ? 'cursor-crosshair select-none' : ''
        } ${isLongPressing ? 'bg-primary/5' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => {
          if (isScreenshotMode) {
            handleScreenshotTouchStart(e);
          } else {
            handleTouchStart(e);
            handlePinchStart(e);
          }
        }}
        onTouchMove={(e) => {
          if (isScreenshotMode) {
            handleScreenshotTouchMove(e);
          } else {
            handleTouchMove(e);
            handlePinchMove(e);
          }
        }}
        onTouchEnd={() => {
          if (isScreenshotMode) {
            handleScreenshotTouchEnd();
          } else {
            handleTouchEnd();
            handlePinchEnd();
          }
        }}
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
          className="relative mx-auto inline-block"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease'
          }}
        >
          {/* Original image */}
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt={imageName}
            className="max-w-full h-auto rounded-lg shadow-lg"
            crossOrigin="anonymous"
          />
          
          {/* Text overlay - Google Lens style */}
          {showOverlay && ocrText && !isScreenshotMode && (
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute inset-0 bg-background/70 backdrop-blur-[2px] rounded-lg pointer-events-auto"
                style={{ userSelect: 'text' }}
              >
                <div className="p-4 md:p-6 text-foreground text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                  {textLines.map((line, index) => (
                    <p key={index} className="mb-2 cursor-text">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot mode instructions */}
      {isScreenshotMode && !isCapturing && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
          <Square className="w-4 h-4" />
          {isMobile ? "Tap and drag to select area, or use Full Image" : "Drag to select area, or click 'Full Image' for instant capture"}
        </div>
      )}

      {/* Desktop text selection toolbar with study tools */}
      {!isMobile && showSearchPrompt && !isScreenshotMode && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 md:max-w-md">
          <TextSelectionToolbar
            selectedText={selectedText}
            onDismiss={handleDismiss}
            onSearchVideos={handleSearch}
            onGenerateQuiz={(settings) => onGenerateQuizFromText?.(selectedText, settings)}
            onGenerateFlashcards={(settings) => onGenerateFlashcardsFromText?.(selectedText, settings)}
            onGenerateSummary={(settings) => onGenerateSummaryFromText?.(selectedText, settings)}
            onGenerateMindMap={(settings) => onGenerateMindMapFromText?.(selectedText, settings)}
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
        onSearchVideos={handleSearch}
        onGenerateQuiz={(settings) => onGenerateQuizFromText?.(selectedText, settings)}
        onGenerateFlashcards={(settings) => onGenerateFlashcardsFromText?.(selectedText, settings)}
        onGenerateSummary={(settings) => onGenerateSummaryFromText?.(selectedText, settings)}
        onGenerateMindMap={(settings) => onGenerateMindMapFromText?.(selectedText, settings)}
        isGeneratingQuiz={isGeneratingQuiz}
        isGeneratingFlashcards={isGeneratingFlashcards}
        isGeneratingSummary={isGeneratingSummary}
        isGeneratingMindMap={isGeneratingMindMap}
        isSearching={isSearching}
      />

      {/* Instructions */}
      <div className="text-center text-xs text-muted-foreground py-2 px-2">
        {isMobile ? (
          ocrText 
            ? "💡 Select text & long-press to use tools • Pinch to zoom"
            : "💡 Use Screenshot to capture areas • Pinch to zoom"
        ) : (
          ocrText 
            ? "💡 Select text to use study tools • Toggle overlay to see original • Use Screenshot for specific areas"
            : "💡 Use Screenshot button to capture areas for search"
        )}
      </div>
    </div>
  );
};
