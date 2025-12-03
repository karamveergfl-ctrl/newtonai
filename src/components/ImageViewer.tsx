import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Search, Eye, EyeOff, ZoomIn, ZoomOut, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageViewerProps {
  imageUrl: string;
  imageName: string;
  ocrText?: string;
  onTextSelect: (text: string) => void;
  onImageCapture: (imageData: string) => void;
}

export const ImageViewer = ({ 
  imageUrl, 
  imageName,
  ocrText, 
  onTextSelect,
  onImageCapture
}: ImageViewerProps) => {
  const [showOverlay, setShowOverlay] = useState(!!ocrText);
  const [selectedText, setSelectedText] = useState("");
  const [showSearchPrompt, setShowSearchPrompt] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotStart, setScreenshotStart] = useState<{ x: number; y: number } | null>(null);
  const [screenshotEnd, setScreenshotEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleTextSelection = () => {
      if (isScreenshotMode || isCapturing) return;
      
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length >= 5) {
        setSelectedText(text);
        setShowSearchPrompt(true);
      }
    };

    document.addEventListener("mouseup", handleTextSelection);
    return () => document.removeEventListener("mouseup", handleTextSelection);
  }, [isScreenshotMode, isCapturing]);

  const handleSearch = () => {
    if (selectedText) {
      onTextSelect(selectedText);
      setShowSearchPrompt(false);
      setSelectedText("");
      window.getSelection()?.removeAllRanges();
    }
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
      description: "Click and drag to select an area",
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
    setIsCapturing(true);
    setScreenshotStart({ 
      x: e.clientX - rect.left + container.scrollLeft, 
      y: e.clientY - rect.top + container.scrollTop 
    });
    setScreenshotEnd({ 
      x: e.clientX - rect.left + container.scrollLeft, 
      y: e.clientY - rect.top + container.scrollTop 
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScreenshotMode || !isCapturing) return;
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    setScreenshotEnd({ 
      x: e.clientX - rect.left + container.scrollLeft, 
      y: e.clientY - rect.top + container.scrollTop 
    });
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!isScreenshotMode || !isCapturing || !screenshotStart || !screenshotEnd) return;
    e.preventDefault();
    
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
    
    // Calculate offset of image within container
    const imageOffsetX = imageRect.left - containerRect.left + container.scrollLeft;
    const imageOffsetY = imageRect.top - containerRect.top + container.scrollTop;
    
    // Adjust for zoom
    const x = (Math.min(screenshotStart.x, screenshotEnd.x) - imageOffsetX) / zoom;
    const y = (Math.min(screenshotStart.y, screenshotEnd.y) - imageOffsetY) / zoom;
    const cropWidth = width / zoom;
    const cropHeight = height / zoom;
    
    // Scale to actual image dimensions
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

  const getSelectionStyle = () => {
    if (!screenshotStart || !screenshotEnd || !containerRef.current) return {};
    
    const container = containerRef.current;
    
    return {
      left: Math.min(screenshotStart.x, screenshotEnd.x) - container.scrollLeft,
      top: Math.min(screenshotStart.y, screenshotEnd.y) - container.scrollTop,
      width: Math.abs(screenshotEnd.x - screenshotStart.x),
      height: Math.abs(screenshotEnd.y - screenshotStart.y),
    };
  };

  const textLines = ocrText?.split('\n').filter(line => line.trim()) || [];

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <Card className="p-2 border-0 shadow-sm bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="h-8"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              className="h-8"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {ocrText && (
              <Button
                variant={showOverlay ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOverlay(!showOverlay)}
                className="h-8 gap-1 text-xs"
                disabled={isScreenshotMode}
              >
                {showOverlay ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showOverlay ? "Hide Text" : "Show Text"}
              </Button>
            )}
            
            {!isScreenshotMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={activateScreenshotMode}
                className="h-8 gap-1 text-xs"
              >
                <Camera className="w-3 h-3" />
                Screenshot
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={cancelScreenshotMode}
                className="h-8 gap-1 text-xs"
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Image with text overlay */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto bg-muted/10 p-4 relative ${
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
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-pulse">
          Click and drag to select area
        </div>
      )}

      {/* Search prompt */}
      {showSearchPrompt && !isScreenshotMode && (
        <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 p-3 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm animate-fade-in max-w-sm w-11/12 md:max-w-md">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Selected text:</p>
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
              onClick={handleSearch}
              className="w-full gap-2"
              size="sm"
            >
              <Search className="w-4 h-4" />
              Find Videos
            </Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <div className="text-center text-xs text-muted-foreground py-2 px-2">
        {ocrText 
          ? "💡 Select extracted text to search • Toggle overlay to see original • Use Screenshot for specific areas"
          : "💡 Use Screenshot button to capture areas for search"}
      </div>
    </div>
  );
};
