import { useRef, useEffect, useCallback } from "react";
import type { Annotation } from "@/hooks/useDocumentAnnotations";

interface AnnotationLayerProps {
  width: number;
  height: number;
  annotations: Annotation[];
  tool: "draw" | "highlight";
  color: string;
  lineWidth: number;
  onAnnotationAdd?: (annotation: Annotation) => void;
  pageIndex: number;
  readOnly?: boolean;
}

export function AnnotationLayer({
  width,
  height,
  annotations,
  tool,
  color,
  lineWidth,
  onAnnotationAdd,
  pageIndex,
  readOnly = false,
}: AnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  // Render existing annotations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    for (const ann of annotations) {
      if (ann.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      for (let i = 1; i < ann.points.length; i++) {
        ctx.lineTo(ann.points[i].x, ann.points[i].y);
      }

      if (ann.type === "highlight") {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.width || 20;
        ctx.globalAlpha = 0.3;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.width || 2;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }
  }, [width, height, annotations]);

  const getPos = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * width,
        y: ((e.clientY - rect.top) / rect.height) * height,
      };
    },
    [width, height]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (readOnly) return;
      isDrawingRef.current = true;
      pointsRef.current = [getPos(e)];
    },
    [readOnly, getPos]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current || readOnly) return;
      pointsRef.current.push(getPos(e));
    },
    [readOnly, getPos]
  );

  const onPointerUp = useCallback(() => {
    if (!isDrawingRef.current || readOnly) return;
    isDrawingRef.current = false;

    if (pointsRef.current.length >= 2) {
      onAnnotationAdd?.({
        type: tool === "highlight" ? "highlight" : "draw",
        points: pointsRef.current,
        color,
        pageIndex,
        width: lineWidth,
      });
    }
    pointsRef.current = [];
  }, [readOnly, tool, color, pageIndex, lineWidth, onAnnotationAdd]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 touch-none"
      style={{ width: "100%", height: "100%", cursor: readOnly ? "default" : "crosshair" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    />
  );
}
