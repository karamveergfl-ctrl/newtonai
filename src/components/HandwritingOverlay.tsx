import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Search, Eye, EyeOff, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HandwritingOverlayProps {
  imageUrl: string;
  ocrText: string;
  onTextSelect: (text: string) => void;
  onClose: () => void;
}

export const HandwritingOverlay = ({ 
  imageUrl, 
  ocrText, 
  onTextSelect,
  onClose 
}: HandwritingOverlayProps) => {
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedText, setSelectedText] = useState("");
  const [showSearchPrompt, setShowSearchPrompt] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length >= 5) {
        setSelectedText(text);
        setShowSearchPrompt(true);
      }
    };

    document.addEventListener("mouseup", handleTextSelection);
    return () => document.removeEventListener("mouseup", handleTextSelection);
  }, []);

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

  // Parse OCR text into lines for better display
  const textLines = ocrText.split('\n').filter(line => line.trim());

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
            <Button
              variant={showOverlay ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOverlay(!showOverlay)}
              className="h-8 gap-1 text-xs"
            >
              {showOverlay ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showOverlay ? "Hide Text" : "Show Text"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Image with text overlay */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/10 p-4"
      >
        <div 
          className="relative mx-auto"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease'
          }}
        >
          {/* Original image */}
          <img 
            src={imageUrl} 
            alt="Handwritten content"
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
          
          {/* Text overlay - Google Lens style */}
          {showOverlay && (
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-lg pointer-events-auto"
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

      {/* Search prompt */}
      {showSearchPrompt && (
        <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 p-3 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm animate-fade-in max-w-sm w-11/12 md:max-w-md">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Selected from handwriting:</p>
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
        💡 Select any extracted text to search for videos • Toggle overlay to see original
      </div>
    </div>
  );
};
