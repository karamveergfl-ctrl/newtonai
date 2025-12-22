import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSearchPrompt } from "@/components/MobileSearchPrompt";
import { ScreenshotCapture } from "@/components/ScreenshotCapture";
import { SolutionPanel } from "@/components/SolutionPanel";
import { supabase } from "@/integrations/supabase/client";
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
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  // Solution panel state
  const [showSolution, setShowSolution] = useState(false);
  const [solutionContent, setSolutionContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [searchTopic, setSearchTopic] = useState<string>("");
  
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Handle text selection
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
  }, [isScreenshotMode, isMobile]);

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

  const activateScreenshotMode = () => {
    setIsScreenshotMode(true);
  };

  const cancelScreenshotMode = () => {
    setIsScreenshotMode(false);
  };

  // Get canvas for screenshot capture
  const getCanvas = useCallback(() => {
    return document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement | null;
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
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && pageNumber < numPages) {
        setPageNumber(prev => prev + 1);
      } else if (diff < 0 && pageNumber > 1) {
        setPageNumber(prev => prev - 1);
      }
    }
    setTouchStartX(null);
  };

  const closeSolutionPanel = () => {
    setShowSolution(false);
    setSolutionContent("");
    setCapturedImage(null);
    setSearchTopic("");
  };

  return (
    <div className="h-full flex">
      {/* Main PDF Area */}
      <div className={`flex-1 flex flex-col ${showSolution ? 'w-1/2' : 'w-full'}`}>
        {/* Navigation bar with screenshot button */}
        <div className="group/nav">
          <Card className="p-2 border-0 shadow-sm bg-background/80 backdrop-blur-sm md:opacity-0 md:group-hover/nav:opacity-100 transition-opacity duration-300">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                disabled={pageNumber <= 1}
                className="h-10 w-10 md:h-8 md:w-8"
              >
                <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground px-2">
                  {pageNumber} / {numPages}
                </span>
                
                {!isScreenshotMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={activateScreenshotMode}
                    className="h-9 md:h-7 gap-1 text-xs px-3"
                  >
                    <Camera className="w-4 h-4 md:w-3 md:h-3" />
                    <span className="hidden sm:inline">Capture & Solve</span>
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={cancelScreenshotMode}
                    className="h-9 md:h-7 gap-1 text-xs px-3"
                  >
                    <X className="w-4 h-4 md:w-3 md:h-3" />
                    Cancel
                  </Button>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                disabled={pageNumber >= numPages}
                className="h-10 w-10 md:h-8 md:w-8"
              >
                <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* PDF Display */}
        <div 
          ref={containerRef}
          className={`flex-1 flex justify-center overflow-auto bg-muted/10 scrollbar-thin pdf-container relative ${
            isLongPressing ? 'bg-primary/5' : ''
          }`}
          onTouchStart={!isScreenshotMode ? handleTouchStart : undefined}
          onTouchMove={!isScreenshotMode ? handleTouchMove : undefined}
          onTouchEnd={!isScreenshotMode ? handleTouchEnd : undefined}
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
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
            className="w-full"
          >
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
                width={typeof window !== 'undefined' ? Math.min(window.innerWidth * (showSolution ? 0.45 : 0.9), showSolution ? 500 : 800) : 800}
              />
            </Document>
          </div>
        </div>

        {/* Desktop search prompt */}
        {!isMobile && showSearchPrompt && !isScreenshotMode && (
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

        {/* Mobile search prompt (bottom drawer) */}
        <MobileSearchPrompt
          open={showMobilePrompt}
          onOpenChange={setShowMobilePrompt}
          selectedText={selectedText}
          onSearch={handleMobileSearch}
        />

        <div className="text-center text-xs text-muted-foreground mt-2 px-2">
          {isMobile ? (
            "💡 Capture area to solve • Select text & long-press to search"
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
