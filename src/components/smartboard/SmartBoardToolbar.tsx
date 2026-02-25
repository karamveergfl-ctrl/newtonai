import { Button } from "@/components/ui/button";
import {
  PenTool,
  FileText,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Sun,
  Moon,
  X,
  Undo2,
  Redo2,
  Trash2,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WhiteboardTool } from "@/hooks/useWhiteboardState";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

interface SmartBoardToolbarProps {
  activeView: "session" | "whiteboard" | "document";
  onViewChange: (view: "session" | "whiteboard" | "document") => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  isCapturing: boolean;
  onToggleCapture: () => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  onEndSession?: () => void;
  // Whiteboard controls
  whiteboardTool: WhiteboardTool;
  onToolChange: (tool: WhiteboardTool) => void;
  whiteboardColor: string;
  onColorChange: (color: string) => void;
  penSize: number;
  onPenSizeChange: (size: number) => void;
  presetColors: string[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

export function SmartBoardToolbar({
  activeView,
  onViewChange,
  voiceEnabled,
  onToggleVoice,
  isCapturing,
  onToggleCapture,
  isDarkTheme,
  onToggleTheme,
  onEndSession,
  whiteboardTool,
  onToolChange,
  whiteboardColor,
  onColorChange,
  penSize,
  onPenSizeChange,
  presetColors,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
}: SmartBoardToolbarProps) {
  const btnClass = "min-h-[48px] min-w-[48px] text-sm";

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border bg-card shrink-0 overflow-x-auto scrollbar-hide">
      {/* View switchers */}
      <Button
        variant={activeView === "session" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("session")}
        className={btnClass}
        title="Session View"
      >
        <FileText className="w-5 h-5" />
      </Button>
      <Button
        variant={activeView === "whiteboard" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("whiteboard")}
        className={btnClass}
        title="Whiteboard"
      >
        <PenTool className="w-5 h-5" />
      </Button>

      {/* Whiteboard tools (visible when whiteboard active) */}
      {activeView === "whiteboard" && (
        <>
          <div className="w-px h-8 bg-border mx-1" />

          {/* Tool selection */}
          {(["pen", "highlighter", "eraser"] as WhiteboardTool[]).map((t) => (
            <Button
              key={t}
              variant={whiteboardTool === t ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onToolChange(t)}
              className={cn(btnClass, "capitalize")}
            >
              {t === "pen" ? "✏️" : t === "highlighter" ? "🖍️" : "🧹"}
            </Button>
          ))}

          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className={btnClass}>
                <div
                  className="w-5 h-5 rounded-full border-2 border-foreground/30"
                  style={{ backgroundColor: whiteboardColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" side="top">
              <div className="grid grid-cols-4 gap-2">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform",
                      whiteboardColor === c
                        ? "border-primary scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => onColorChange(c)}
                  />
                ))}
              </div>
              <div className="mt-3">
                <label className="text-xs text-muted-foreground">Size</label>
                <Slider
                  min={1}
                  max={20}
                  step={1}
                  value={[penSize]}
                  onValueChange={([v]) => onPenSizeChange(v)}
                  className="mt-1"
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Undo/Redo/Clear */}
          <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} className={btnClass}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} className={btnClass}>
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear} className={btnClass}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Voice toggle */}
      <Button
        variant={voiceEnabled ? "default" : "ghost"}
        size="sm"
        onClick={onToggleVoice}
        className={btnClass}
        title="Voice Commands"
      >
        {voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </Button>

      {/* Capture toggle */}
      <Button
        variant={isCapturing ? "destructive" : "ghost"}
        size="sm"
        onClick={onToggleCapture}
        className={btnClass}
        title={isCapturing ? "Stop Recording" : "Start Recording"}
      >
        {isCapturing ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </Button>

      {/* Theme toggle */}
      <Button variant="ghost" size="sm" onClick={onToggleTheme} className={btnClass} title="Toggle Theme">
        {isDarkTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      {/* End session */}
      {onEndSession && (
        <Button variant="destructive" size="sm" onClick={onEndSession} className={cn(btnClass, "gap-1.5")}>
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">End</span>
        </Button>
      )}
    </div>
  );
}
