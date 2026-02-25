import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";
import type { WhiteboardTool } from "@/hooks/useWhiteboardState";

interface WhiteboardCanvasProps {
  tool: WhiteboardTool;
  color: string;
  penSize: number;
  highlighterSize: number;
  eraserSize: number;
  onStrokeEnd?: () => void;
  onBeforeStroke?: (ctx: CanvasRenderingContext2D) => void;
  className?: string;
}

export interface WhiteboardCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  clear: () => void;
  restoreImageData: (data: ImageData) => void;
}

export const WhiteboardCanvas = forwardRef<WhiteboardCanvasHandle, WhiteboardCanvasProps>(
  function WhiteboardCanvas(
    { tool, color, penSize, highlighterSize, eraserSize, onStrokeEnd, onBeforeStroke, className },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      clear: () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
      },
      restoreImageData: (data: ImageData) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) ctx.putImageData(data, 0, 0);
      },
    }));

    // Resize canvas to fill container
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resize = () => {
        const parent = canvas.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        // Save current content
        const ctx = canvas.getContext("2d");
        let imageData: ImageData | null = null;
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
        canvas.width = rect.width;
        canvas.height = rect.height;
        // Restore content
        if (ctx && imageData) {
          ctx.putImageData(imageData, 0, 0);
        }
      };

      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(canvas.parentElement!);
      return () => observer.disconnect();
    }, []);

    const getPos = useCallback((e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }, []);

    const getLineWidth = useCallback(
      (pressure: number) => {
        const base =
          tool === "highlighter" ? highlighterSize :
          tool === "eraser" ? eraserSize : penSize;
        // Pressure ranges 0-1; default to 0.5 for mouse
        const p = pressure > 0 ? pressure : 0.5;
        return base * (0.5 + p);
      },
      [tool, penSize, highlighterSize, eraserSize]
    );

    const onPointerDown = useCallback(
      (e: React.PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        isDrawingRef.current = true;
        canvas.setPointerCapture(e.pointerId);

        onBeforeStroke?.(ctx);

        const pos = getPos(e.nativeEvent);
        lastPointRef.current = pos;

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      },
      [getPos, onBeforeStroke]
    );

    const onPointerMove = useCallback(
      (e: React.PointerEvent) => {
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const pos = getPos(e.nativeEvent);
        const lw = getLineWidth(e.pressure);

        ctx.lineWidth = lw;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.strokeStyle = "rgba(0,0,0,1)";
        } else if (tool === "highlighter") {
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.3;
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = color;
          ctx.globalAlpha = 1;
        }

        ctx.beginPath();
        if (lastPointRef.current) {
          ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        }
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        // Reset alpha
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";

        lastPointRef.current = pos;
      },
      [getPos, getLineWidth, tool, color]
    );

    const onPointerUp = useCallback(() => {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      onStrokeEnd?.();
    }, [onStrokeEnd]);

    return (
      <canvas
        ref={canvasRef}
        className={cn("touch-none cursor-crosshair", className)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
    );
  }
);
