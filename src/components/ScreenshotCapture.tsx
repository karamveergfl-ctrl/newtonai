import { useState, useRef, useEffect, useCallback } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScreenshotCaptureProps {
  containerRef: React.RefObject<HTMLElement>;
  onCapture: (imageData: string, mimeType: string) => void;
  onCancel: () => void;
}

export function ScreenshotCapture({ containerRef, onCapture, onCancel }: ScreenshotCaptureProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [endPos, setEndPos] = useState<{ x: number; y: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const getSelectionRect = useCallback(() => {
    if (!startPos || !endPos) return null;
    return {
      x: Math.min(startPos.x, endPos.x),
      y: Math.min(startPos.y, endPos.y),
      width: Math.abs(endPos.x - startPos.x),
      height: Math.abs(endPos.y - startPos.y),
    };
  }, [startPos, endPos]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setEndPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsSelecting(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    setEndPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = async () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    const selection = getSelectionRect();
    if (!selection || selection.width < 20 || selection.height < 20) return;
    await captureSelection(selection);
  };

  const captureSelection = async (selection: { x: number; y: number; width: number; height: number }) => {
    setIsCapturing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (!containerRef.current || !overlayRef.current) throw new Error("Container not found");

      const overlayRect = overlayRef.current.getBoundingClientRect();
      const scaleX = containerRef.current.scrollWidth / overlayRect.width;
      const scaleY = containerRef.current.scrollHeight / overlayRect.height;
      const scrollTop = containerRef.current.scrollTop || 0;
      const scrollLeft = containerRef.current.scrollLeft || 0;

      const captureX = selection.x * scaleX + scrollLeft;
      const captureY = selection.y * scaleY + scrollTop;
      const captureWidth = selection.width * scaleX;
      const captureHeight = selection.height * scaleY;

      const canvas = await html2canvas(containerRef.current, { useCORS: true, allowTaint: true, scale: 2, logging: false });
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = captureWidth * 2;
      croppedCanvas.height = captureHeight * 2;

      const ctx = croppedCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.drawImage(canvas, captureX * 2, captureY * 2, captureWidth * 2, captureHeight * 2, 0, 0, captureWidth * 2, captureHeight * 2);
      const imageData = croppedCanvas.toDataURL('image/png').split(',')[1];
      onCapture(imageData, 'image/png');
    } catch (error) {
      console.error("Screenshot capture error:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const selection = getSelectionRect();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-50 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => isSelecting && setIsSelecting(false)}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border z-10">
        <span className="text-sm font-medium text-foreground">
          {isCapturing ? "Capturing..." : "Click and drag to select the problem area"}
        </span>
      </div>

      {/* Selection rectangle */}
      {selection && selection.width > 0 && selection.height > 0 && (
        <div
          className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height,
          }}
        >
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground whitespace-nowrap">
            {Math.round(selection.width)} × {Math.round(selection.height)}
          </div>
        </div>
      )}

      {/* Capture button */}
      {!isSelecting && selection && selection.width > 50 && selection.height > 50 && (
        <div
          className="absolute z-20 flex gap-2"
          style={{
            left: selection.x + selection.width / 2,
            top: selection.y + selection.height + 40,
            transform: 'translateX(-50%)',
          }}
        >
          <Button
            size="sm"
            onClick={() => captureSelection(selection)}
            disabled={isCapturing}
            className="shadow-lg"
          >
            {isCapturing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Capture & Solve
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} className="shadow-lg">
            Cancel
          </Button>
        </div>
      )}

      {/* Loading overlay */}
      {isCapturing && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-30">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium">Capturing screenshot...</span>
          </div>
        </div>
      )}
    </div>
  );
}
