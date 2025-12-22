import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Search, Eye, EyeOff, ZoomIn, ZoomOut, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSearchPrompt } from "@/components/MobileSearchPrompt";
import { ScreenshotCapture } from "@/components/ScreenshotCapture";
import { SolutionPanel } from "@/components/SolutionPanel";
import { supabase } from "@/integrations/supabase/client";

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
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  // Solution panel state
  const [showSolution, setShowSolution] = useState(false);
  const [solutionContent, setSolutionContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [searchTopic, setSearchTopic] = useState<string>("");
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleTextSelection = () => {
      if (isScreenshotMode) return;
      
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
  }, [isScreenshotMode, isMobile]);

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
  };

  const cancelScreenshotMode = () => {
    setIsScreenshotMode(false);
  };

  // Get canvas for screenshot capture (create from image)
  const getCanvas = useCallback(() => {
    const image = imageRef.current;
    if (!image) return null;

    // Create a temporary canvas from the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);

    // Return a fake canvas element positioned like the image
    const wrapper = document.createElement('canvas');
    wrapper.width = image.naturalWidth;
    wrapper.height = image.naturalHeight;
    const wCtx = wrapper.getContext('2d');
    if (wCtx) {
      wCtx.drawImage(image, 0, 0);
    }
    
    // Attach position info
    (wrapper as any).getBoundingClientRect = () => image.getBoundingClientRect();
    
    return wrapper;
  }, []);

  // Handle screenshot capture - send directly to AI for analysis
  const handleScreenshotCapture = async (imageData: string) => {
    setIsScreenshotMode(false);
    setCapturedImage(imageData);
    setShowSolution(true);
    setIsAnalyzing(true);
    setSolutionContent("");
    setSearchTopic("");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-screenshot', {
        body: { imageData }
      });

      if (error) {
        console.error("Error analyzing screenshot:", error);
        toast({
          title: "Analysis failed",
          description: error.message || "Could not analyze the captured area",
          variant: "destructive",
        });
        setSolutionContent("Failed to analyze the image. Please try again.");
      } else if (data?.solution) {
        setSolutionContent(data.solution);
        if (data.searchTopic) {
          setSearchTopic(data.searchTopic);
        }
        toast({
          title: "Analysis complete!",
          description: "Solution is ready",
        });
      } else {
        setSolutionContent("No solution could be generated. Please try capturing a clearer area.");
      }
    } catch (err) {
      console.error("Screenshot analysis error:", err);
      toast({
        title: "Error",
        description: "Failed to analyze screenshot",
        variant: "destructive",
      });
      setSolutionContent("An error occurred. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
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

  const closeSolutionPanel = () => {
    setShowSolution(false);
    setSolutionContent("");
    setCapturedImage(null);
    setSearchTopic("");
  };

  return (
    <div className="h-full flex">
      {/* Main Image Area */}
      <div className={`flex-1 flex flex-col ${showSolution ? 'w-1/2' : 'w-full'}`}>
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
                  <span className="hidden sm:inline">Capture & Solve</span>
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={cancelScreenshotMode}
                  className="h-9 md:h-8 gap-1 text-xs px-2 md:px-3"
                >
                  <X className="w-4 h-4 md:w-3 md:h-3" />
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
            isLongPressing ? 'bg-primary/5' : ''
          }`}
          onTouchStart={(e) => {
            if (!isScreenshotMode) {
              handleTouchStart(e);
              handlePinchStart(e);
            }
          }}
          onTouchMove={(e) => {
            if (!isScreenshotMode) {
              handleTouchMove(e);
              handlePinchMove(e);
            }
          }}
          onTouchEnd={() => {
            if (!isScreenshotMode) {
              handleTouchEnd();
              handlePinchEnd();
            }
          }}
        >
          {/* Screenshot capture overlay */}
          <ScreenshotCapture
            targetRef={containerRef}
            isActive={isScreenshotMode}
            onCapture={handleScreenshotCapture}
            onCancel={cancelScreenshotMode}
            getCanvas={getCanvas}
          />

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

        {/* Desktop search prompt */}
        {!isMobile && showSearchPrompt && !isScreenshotMode && (
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

        {/* Mobile search prompt (bottom drawer) */}
        <MobileSearchPrompt
          open={showMobilePrompt}
          onOpenChange={setShowMobilePrompt}
          selectedText={selectedText}
          onSearch={handleMobileSearch}
        />

        {/* Instructions */}
        <div className="text-center text-xs text-muted-foreground py-2 px-2">
          {isMobile ? (
            "💡 Capture area to solve • Pinch to zoom"
          ) : (
            "💡 Click 'Capture & Solve' to analyze any area with AI"
          )}
        </div>
      </div>

      {/* Solution Panel */}
      {showSolution && (
        <div className="w-1/2 h-full border-l">
          <SolutionPanel
            content={solutionContent}
            isQuestion={true}
            onClose={closeSolutionPanel}
            isLoading={isAnalyzing}
            screenshotImage={capturedImage || undefined}
            searchTopic={searchTopic}
          />
        </div>
      )}
    </div>
  );
};
