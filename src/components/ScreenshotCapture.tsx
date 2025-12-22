import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Check, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import html2canvas from "html2canvas";

interface ScreenshotCaptureProps {
  targetRef: React.RefObject<HTMLElement>;
  isActive: boolean;
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  getCanvas?: () => HTMLCanvasElement | null;
}

export const ScreenshotCapture = ({
  targetRef,
  isActive,
  onCapture,
  onCancel,
  getCanvas,
}: ScreenshotCaptureProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [end, setEnd] = useState<{ x: number; y: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Reset state when deactivated
  useEffect(() => {
    if (!isActive) {
      setIsCapturing(false);
      setStart(null);
      setEnd(null);
      setIsProcessing(false);
    }
  }, [isActive]);

  // Handle ESC key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isActive) {
        onCancel();
      }
      if (e.key === "Enter" && isActive && start && end && !isCapturing) {
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, start, end, isCapturing, onCancel]);

  const getCoordinates = useCallback((clientX: number, clientY: number) => {
    const container = targetRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    return {
      x: clientX - rect.left + container.scrollLeft,
      y: clientY - rect.top + container.scrollTop,
    };
  }, [targetRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isActive || isProcessing) return;
    e.preventDefault();
    
    const coords = getCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    setIsCapturing(true);
    setStart(coords);
    setEnd(coords);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isActive || !isCapturing || isProcessing) return;
    e.preventDefault();
    
    const coords = getCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    setEnd(coords);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isActive || !isCapturing || isProcessing) return;
    e.preventDefault();
    setIsCapturing(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isActive || isProcessing) return;
    
    const touch = e.touches[0];
    const coords = getCoordinates(touch.clientX, touch.clientY);
    if (!coords) return;

    setIsCapturing(true);
    setStart(coords);
    setEnd(coords);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isActive || !isCapturing || isProcessing) return;
    
    const touch = e.touches[0];
    const coords = getCoordinates(touch.clientX, touch.clientY);
    if (!coords) return;

    setEnd(coords);
  };

  const handleTouchEnd = () => {
    if (!isActive || !isCapturing || isProcessing) return;
    setIsCapturing(false);
  };

  const getSelectionStyle = () => {
    if (!start || !end || !targetRef.current) return {};

    const container = targetRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const left = Math.min(start.x, end.x) - scrollLeft;
    const top = Math.min(start.y, end.y) - scrollTop;
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    return { left, top, width, height };
  };

  const getDimensions = () => {
    if (!start || !end) return null;
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    return { width: Math.round(width), height: Math.round(height) };
  };

  const handleConfirm = async () => {
    if (!start || !end || !targetRef.current) return;
    
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    if (width < 20 || height < 20) {
      return;
    }

    setIsProcessing(true);

    try {
      const container = targetRef.current;
      
      // Hide the overlay temporarily for clean screenshot
      if (overlayRef.current) {
        overlayRef.current.style.display = 'none';
      }

      // Use html2canvas to capture the container
      const fullCanvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        scrollX: -container.scrollLeft,
        scrollY: -container.scrollTop,
        x: container.scrollLeft,
        y: container.scrollTop,
        width: container.clientWidth,
        height: container.clientHeight,
      });

      // Show overlay again
      if (overlayRef.current) {
        overlayRef.current.style.display = 'block';
      }

      // Calculate crop coordinates
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);

      // Scale factors
      const scaleX = fullCanvas.width / container.clientWidth;
      const scaleY = fullCanvas.height / container.clientHeight;

      // Adjust for scroll position
      const adjustedX = (x - container.scrollLeft) * scaleX;
      const adjustedY = (y - container.scrollTop) * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      // Create cropped canvas
      const cropCanvas = document.createElement("canvas");
      const ctx = cropCanvas.getContext("2d");
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      cropCanvas.width = scaledWidth;
      cropCanvas.height = scaledHeight;

      ctx.drawImage(
        fullCanvas,
        Math.max(0, adjustedX),
        Math.max(0, adjustedY),
        scaledWidth,
        scaledHeight,
        0,
        0,
        scaledWidth,
        scaledHeight
      );

      const imageData = cropCanvas.toDataURL("image/png");
      console.log("Screenshot captured successfully, size:", imageData.length);
      onCapture(imageData);
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      // Show overlay again in case of error
      if (overlayRef.current) {
        overlayRef.current.style.display = 'block';
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isActive) return null;

  const selectionStyle = getSelectionStyle();
  const dimensions = getDimensions();
  const hasValidSelection = dimensions && dimensions.width >= 20 && dimensions.height >= 20;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-50"
      style={{ cursor: isProcessing ? "wait" : "crosshair" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dimmed overlay */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Selection rectangle */}
      {start && end && (
        <>
          {/* Clear selection area */}
          <div
            className="absolute bg-transparent border-2 border-dashed border-white shadow-lg"
            style={{
              ...selectionStyle,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Animated border */}
            <div className="absolute inset-0 border-2 border-primary animate-pulse" />
            
            {/* Corner handles */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full border-2 border-primary" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full border-2 border-primary" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full border-2 border-primary" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full border-2 border-primary" />
          </div>

          {/* Dimensions badge */}
          {dimensions && (
            <div
              className="absolute px-2 py-1 bg-primary text-primary-foreground text-xs font-mono rounded shadow-lg pointer-events-none"
              style={{
                left: selectionStyle.left,
                top: (selectionStyle.top || 0) - 28,
              }}
            >
              {dimensions.width} × {dimensions.height}
            </div>
          )}

          {/* Action buttons - show when not actively dragging */}
          {!isCapturing && hasValidSelection && (
            <div
              className="absolute flex items-center gap-2 pointer-events-auto"
              style={{
                left: (selectionStyle.left || 0) + (selectionStyle.width || 0) / 2,
                top: (selectionStyle.top || 0) + (selectionStyle.height || 0) + 12,
                transform: "translateX(-50%)",
              }}
            >
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="h-8 px-3 gap-1 shadow-lg"
                disabled={isProcessing}
              >
                <X className="w-4 h-4" />
                {!isMobile && "Cancel"}
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirm();
                }}
                className="h-8 px-3 gap-1 shadow-lg bg-green-600 hover:bg-green-700"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {!isMobile && (isProcessing ? "Processing..." : "Capture")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Instructions */}
      {!start && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm px-6 py-4 rounded-xl">
            <p className="text-lg font-medium mb-1">
              {isMobile ? "Tap and drag" : "Click and drag"}
            </p>
            <p className="text-sm text-white/80">
              Select area to capture and analyze
            </p>
            <p className="text-xs text-white/60 mt-2">
              Press ESC to cancel
            </p>
          </div>
        </div>
      )}
    </div>
  );
};