import { useState, useCallback, useRef } from "react";

export type WhiteboardTool = "pen" | "highlighter" | "eraser" | "text";

export interface WhiteboardState {
  tool: WhiteboardTool;
  color: string;
  penSize: number;
  highlighterSize: number;
  eraserSize: number;
}

const PRESET_COLORS = [
  "#FFFFFF", "#000000", "#EF4444", "#3B82F6",
  "#22C55E", "#F59E0B", "#A855F7", "#EC4899",
];

const MAX_UNDO_STACK = 50;

export function useWhiteboardState() {
  const [tool, setTool] = useState<WhiteboardTool>("pen");
  const [color, setColor] = useState("#FFFFFF");
  const [penSize, setPenSize] = useState(3);
  const [highlighterSize, setHighlighterSize] = useState(20);
  const [eraserSize, setEraserSize] = useState(30);

  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushUndo = useCallback((imageData: ImageData) => {
    undoStackRef.current.push(imageData);
    if (undoStackRef.current.length > MAX_UNDO_STACK) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback((ctx: CanvasRenderingContext2D): ImageData | null => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return null;
    const current = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    redoStackRef.current.push(current);
    const prev = stack.pop()!;
    setCanUndo(stack.length > 0);
    setCanRedo(true);
    return prev;
  }, []);

  const redo = useCallback((ctx: CanvasRenderingContext2D): ImageData | null => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return null;
    const current = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    undoStackRef.current.push(current);
    const next = stack.pop()!;
    setCanRedo(stack.length > 0);
    setCanUndo(true);
    return next;
  }, []);

  const clearStacks = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return {
    tool, setTool,
    color, setColor,
    penSize, setPenSize,
    highlighterSize, setHighlighterSize,
    eraserSize, setEraserSize,
    presetColors: PRESET_COLORS,
    canUndo, canRedo,
    pushUndo, undo, redo, clearStacks,
  };
}
